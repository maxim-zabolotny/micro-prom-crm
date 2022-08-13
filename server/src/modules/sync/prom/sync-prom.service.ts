import * as _ from 'lodash';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from '@schemas/category';
import { AppConstants } from '../../../app.constants';
import { SpreadsheetService } from '../../spreadsheet/spreadsheet.service';
import { DataUtilsHelper, TimeHelper } from '@common/helpers';
import { CrmCategoriesService } from '../../crm/categories/categories.service';
import { GoogleSpreadsheetRow } from 'google-spreadsheet';
import { CrmProductsService } from '../../crm/products/products.service';
import { ProductDocument } from '@schemas/product';
import { PromProductsService } from '../../prom/products/products.service';
import { Product as PromProduct } from '@lib/prom';

export interface ILoadCategoriesToSheetResult {
  newCategoriesCount: number;
  addedRowsCount: number;
  updatedCategories: CategoryDocument[];
  success: boolean;
}

export interface ISyncCategoriesResult {
  addedRowsCount: number;
  removedRowsCount: number;
  updatedCategories: CategoryDocument[];
}

export interface ILoadProductsToSheetResult {
  newProductsCount: number;
  addedRowsCount: number;
  updatedProducts: ProductDocument[];
  success: boolean;
}

export type TEditPromProduct = Required<
  Pick<
    PromProduct.IPostProductsEditByExternalIdBody,
    'id' | 'presence' | 'price' | 'status' | 'quantity_in_stock'
  >
>;

export type TUpdateProductInProm = Pick<
  ProductDocument,
  '_id' | 'ourPrice' | 'quantity' | 'available' | 'deleted'
>;

@Injectable()
export class SyncPromService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    private spreadsheetService: SpreadsheetService,
    private crmCategoriesService: CrmCategoriesService,
    private crmProductsService: CrmProductsService,
    private promProductsService: PromProductsService,
    private dataUtilsHelper: DataUtilsHelper,
    private timeHelper: TimeHelper,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  // UTILITIES PART
  private mapEntityFields(
    mapRecord: Array<[string, string, (v: unknown) => string]>,
    mapDefaultRecord: Array<[string, string]>,
    entity: Record<string, any>,
  ) {
    const entityFields = _.map(
      mapRecord,
      ([keyInTable, keyInEntity, converter]) => {
        return [keyInTable, converter(_.get(entity, keyInEntity))];
      },
    );

    const entityDefaultFields = _.map(
      mapDefaultRecord,
      ([keyInTable, defaultValue]) => {
        return [keyInTable, defaultValue];
      },
    );

    return Object.fromEntries([...entityFields, ...entityDefaultFields]);
  }

  public async getDeletedCategoriesFromDB(idKey: string) {
    const categoriesSheet = this.spreadsheetService.getCategoriesSheet();

    this.logger.debug('Load Category ids from Google Sheet');
    const allRows = await this.spreadsheetService.getAllRows(categoriesSheet, {
      limit: 600,
    });
    const categoryIdsInSheet = _.map(allRows, (row) => row[idKey]);

    this.logger.debug(
      'Load Category ids from DB by Category ids from Google Sheet',
    );
    const categories = await this.categoryModel
      .find({
        _id: { $in: categoryIdsInSheet },
      })
      .select({
        _id: 1,
      })
      .exec();
    const categoryIdsInDB = _.map(categories, (category) =>
      category._id.toString(),
    );

    const { removed: removedIds } = this.dataUtilsHelper.getDiff(
      categoryIdsInDB,
      categoryIdsInSheet,
    );
    this.logger.debug('Detected removed Category ids:', {
      removedIds,
    });

    return _.filter(allRows, (row) => _.includes(removedIds, row[idKey]));
  }

  public async addCategoriesToSheet(categories: Category[]) {
    const categoriesSheet = this.spreadsheetService.getCategoriesSheet();

    this.logger.debug('Build bulk rows for Google Sheet');
    const bulkRows = _.map(categories, (category) =>
      this.mapEntityFields(
        AppConstants.Prom.Sheet.Category.FieldsMapping,
        AppConstants.Prom.Sheet.Category.FieldsMappingDefaults,
        category,
      ),
    );

    this.logger.debug('Add rows with Categories to Google Sheet:', {
      count: bulkRows.length,
    });

    const addedRows = await this.spreadsheetService.addRows(
      categoriesSheet,
      bulkRows,
    );
    this.logger.debug('Added rows to Google Sheet:', {
      count: addedRows.length,
    });

    return addedRows;
  }

  public async addAndSyncCategoriesWithSheet(categories: Category[]) {
    // ADD TO SHEET
    const addedRows = await this.addCategoriesToSheet(categories);

    // UPDATE IN DB
    this.logger.debug('Update Categories in DB:', {
      ids: _.map(categories, '_id'),
      count: categories.length,
    });

    const updatedCategories = await Promise.all(
      _.map(addedRows, async (row) => {
        return this.crmCategoriesService.updateCategoryInDB(
          new Types.ObjectId(row['Ідентифікатор_групи']),
          {
            sync: true,
            syncAt: new Date(),
            promTableLine: row.rowIndex,
          },
        );
      }),
    );
    this.logger.debug('Updated Categories in DB:', {
      ids: _.map(updatedCategories, '_id'),
      count: updatedCategories.length,
    });

    return {
      addedRows,
      updatedCategories,
    };
  }

  public async deleteCategoriesFromSheet(categories: GoogleSpreadsheetRow[]) {
    const categoriesSheet = this.spreadsheetService.getCategoriesSheet();

    this.logger.debug('Remove Categories from Google Sheet', {
      count: categories.length,
    });

    const removedCategoriesFromSheet = await this.spreadsheetService.removeRows(
      categoriesSheet,
      categories,
    );
    this.logger.debug('Removed Categories from Google Sheet:', {
      categories: _.map(removedCategoriesFromSheet, (category) => ({
        id: category['Ідентифікатор_групи'],
        name: category['Назва_групи'],
      })),
      count: removedCategoriesFromSheet.length,
    });

    return removedCategoriesFromSheet;
  }

  public async addProductsToSheet(
    data: Array<{ products: ProductDocument[]; promGroupNumber: number }>,
  ) {
    const {
      NUMBER_OF_CELLS_FOR_PROPERTIES,
      START_PROPERTIES_CELL_INDEX,
      SINGLE_PROPERTY_CELLS_SIZE,
      AVAILABLE_NUMBER_OF_PROPERTIES,
    } = AppConstants.Prom.Sheet.Product;

    const allProducts = _.flattenDeep(_.map(data, 'products'));

    const productsByPromIdMap = new Map(
      _.map(allProducts, (product) => [String(product.promId), product]),
    );

    const productsSheet = this.spreadsheetService.getProductsSheet();

    this.logger.debug('Build bulk rows for Google Sheet');
    const bulkRows = _.flattenDeep(
      _.map(data, ({ products, promGroupNumber }) => {
        return _.map(products, (product) =>
          this.mapEntityFields(
            AppConstants.Prom.Sheet.Product.FieldsMapping,
            AppConstants.Prom.Sheet.Product.FieldsMappingDefaults,
            {
              ...product.toObject(),
              promGroupNumber,
            },
          ),
        );
      }),
    );

    this.logger.debug('Add rows with Products to Google Sheet:', {
      count: bulkRows.length,
    });

    const addedRows = await this.spreadsheetService.addRows(
      productsSheet,
      bulkRows,
    );
    this.logger.debug('Added rows to Google Sheet:', {
      count: addedRows.length,
    });

    this.logger.debug('Add Products specifications to Google Sheet cells:', {
      productsCount: addedRows.length,
    });

    // TODO: check max length of specifications
    await this.spreadsheetService.updateCells(
      productsSheet,
      {
        startRowIndex: 1,
        endRowIndex: addedRows.length + 1,
        startColumnIndex: START_PROPERTIES_CELL_INDEX,
        endColumnIndex:
          START_PROPERTIES_CELL_INDEX + NUMBER_OF_CELLS_FOR_PROPERTIES + 1,
      },
      async () => {
        _.forEach(addedRows, (row) => {
          const promId = row['Код_товару'];
          const product = productsByPromIdMap.get(promId);

          const specifications = [...product.specifications.entries()];
          _.forEach(specifications, ([specKey, specValue], index) => {
            if (index >= AVAILABLE_NUMBER_OF_PROPERTIES) {
              this.logger.debug(
                'Product has too many specifications. Skip next specifications:',
                {
                  count: product.specifications.size,
                  maxCount: AVAILABLE_NUMBER_OF_PROPERTIES,
                },
              );
              return;
            }

            const cellIndex = index * SINGLE_PROPERTY_CELLS_SIZE;

            const [cellNameIndex, cellDimensionIndex, cellValueIndex] = [
              START_PROPERTIES_CELL_INDEX + cellIndex,
              START_PROPERTIES_CELL_INDEX + cellIndex + 1,
              START_PROPERTIES_CELL_INDEX + cellIndex + 2,
            ];

            const [specKeyCell, specValueCell] = [
              productsSheet.getCell(row.rowIndex - 1, cellNameIndex),
              productsSheet.getCell(row.rowIndex - 1, cellValueIndex),
            ];

            specKeyCell.value = specKey;
            specValueCell.value = specValue;
          });
        });
      },
    );
    this.logger.debug('Added Products specifications to Google Sheet cells:', {
      productsCount: addedRows.length,
    });

    return addedRows;
  }

  public async addAndSyncProductsWithSheet(
    data: Array<{ products: ProductDocument[]; promGroupNumber: number }>,
  ) {
    const allProducts = _.flattenDeep(_.map(data, 'products'));

    const productsByPromIdMap = new Map(
      _.map(allProducts, (product) => [String(product.promId), product]),
    );

    // ADD TO SHEET
    const addedRows = await this.addProductsToSheet(data);

    // UPDATE IN DB
    this.logger.debug('Update Products in DB:', {
      ids: _.map(allProducts, '_id'),
      count: allProducts.length,
    });

    const updatedProducts = await Promise.all(
      _.map(addedRows, async (row) => {
        return this.crmProductsService.updateProductInDB(
          productsByPromIdMap.get(row['Код_товару'])._id,
          {
            sync: true,
            syncAt: new Date(),
            promTableLine: row.rowIndex,
          },
        );
      }),
    );
    this.logger.debug('Updated Products in DB:', {
      ids: _.map(updatedProducts, '_id'),
      count: updatedProducts.length,
    });

    return {
      addedRows,
      updatedProducts,
    };
  }

  public async updateProductsInProm(products: Array<TUpdateProductInProm>) {
    this.logger.debug('Build bulk data for Prom');
    const bulkData: Array<TEditPromProduct> = _.map(products, (product) => {
      return {
        id: product._id.toString(),
        price: product.ourPrice,
        quantity_in_stock: product.quantity,
        presence: product.available
          ? PromProduct.ProductPresence.Available
          : PromProduct.ProductPresence.NotAvailable,
        status: product.deleted
          ? PromProduct.ProductStatus.NotOnDisplay
          : PromProduct.ProductStatus.OnDisplay,
      };
    });

    this.logger.debug('Update Products in Prom:', {
      count: bulkData.length,
    });

    const { processed_ids, errors } = await this.promProductsService.edit(
      bulkData as PromProduct.IPostProductsEditByExternalIdBody[],
    );

    const processedIds = processed_ids;
    const unProcessedIds = _.difference(
      _.map(products, (product) => product._id.toString()),
      processedIds,
    );

    this.logger.debug('Update Products in Prom result:', {
      errors,
      processedIds,
      unProcessedIds,
      count: processedIds.length,
    });

    return {
      errors,
      processedIds,
      unProcessedIds,
      products,
    };
  }

  public async updateAndSyncProductsWithProm(
    products: Array<TUpdateProductInProm>,
  ) {
    // UPDATE IN PROM
    const { processedIds, unProcessedIds, errors } =
      await this.updateProductsInProm(products);

    // UPDATE IN DB
    this.logger.debug('Update Products in DB:', {
      ids: processedIds,
      count: processedIds.length,
    });

    const updatedProducts = await Promise.all(
      _.map(processedIds, async (productId) => {
        return this.crmProductsService.updateProductInDB(
          new Types.ObjectId(productId),
          {
            sync: true,
            syncAt: new Date(),
          },
        );
      }),
    );
    this.logger.debug('Updated Products in DB:', {
      ids: _.map(updatedProducts, '_id'),
      count: updatedProducts.length,
    });

    return {
      processedIds,
      unProcessedIds,
      errors,
      updatedProducts,
    };
  }

  // MAIN PART
  public async loadAllNewCategoriesToSheet() {
    const result: ILoadCategoriesToSheetResult = {
      newCategoriesCount: 0,
      addedRowsCount: 0,
      updatedCategories: [],
      success: true,
    };

    const count = await this.crmCategoriesService.getCountOfNewCategoriesInDB();
    this.logger.debug('New Categories count in DB', { count });
    if (count === 0) {
      return result;
    }

    // RESULT
    result.newCategoriesCount = count;

    this.logger.debug('Load new Categories from DB');

    const categories = await this.crmCategoriesService.getNewCategoriesFromDB();
    this.logger.debug('Loaded new Categories:', {
      count: categories.length,
    });

    // ADD TO SHEET
    const { addedRows, updatedCategories } =
      await this.addAndSyncCategoriesWithSheet(categories);

    // RESULT
    result.addedRowsCount = addedRows.length;
    result.updatedCategories = updatedCategories;

    const success = _.isEqual(
      _.uniq([
        result.newCategoriesCount,
        result.addedRowsCount,
        result.updatedCategories.length,
      ]).length,
      1,
    );
    return {
      ...result,
      success,
    };
  }

  // TODO: with prom
  public async syncAllCategoriesWithSheet(add = true, remove = true) {
    if (!add && !remove) {
      throw new HttpException('Nothing for to do', HttpStatus.BAD_REQUEST);
    }

    this.logger.debug('Sync Prom actions:', {
      add,
      remove,
    });

    const result: ISyncCategoriesResult = {
      addedRowsCount: 0,
      removedRowsCount: 0,
      updatedCategories: [],
    };

    if (remove) {
      // SELECT
      const idKey = 'Ідентифікатор_групи';
      const deletedCategories = await this.getDeletedCategoriesFromDB(idKey);

      // REMOVE
      if (!_.isEmpty(deletedCategories)) {
        const removedCategoriesFromSheet = await this.deleteCategoriesFromSheet(
          deletedCategories,
        );

        // RESULT
        result.removedRowsCount = removedCategoriesFromSheet.length;
      } else {
        this.logger.debug(
          'Not found deleted Categories between DB and Google Sheet',
        );
      }
    }

    if (add) {
      const { addedRowsCount, updatedCategories } =
        await this.loadAllNewCategoriesToSheet();

      // RESULT
      result.addedRowsCount = addedRowsCount;
      result.updatedCategories = updatedCategories;
    }

    return result;
  }

  public async loadAllNewProductsByCategoryToSheet(microtronId: string) {
    this.logger.debug('Load Category from DB:', { microtronId });

    const category = await this.crmCategoriesService.getCategoryByMicrotronId(
      microtronId,
    );
    if (!category) {
      throw new HttpException(
        {
          microtronId,
          message: 'Category not found in DB',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    const result: ILoadProductsToSheetResult = {
      newProductsCount: 0,
      addedRowsCount: 0,
      updatedProducts: [],
      success: true,
    };

    const count =
      await this.crmProductsService.getCountOfNewProductsByCategoryInDB(
        category._id,
      );
    this.logger.debug('New Products count in DB', { count });
    if (count === 0) {
      return result;
    }

    // RESULT
    result.newProductsCount = count;

    this.logger.debug('Load new Products from DB');

    const products =
      await this.crmProductsService.getNewProductsByCategoryFromDB(
        category._id,
      );
    this.logger.debug('Loaded new Products:', {
      count: products.length,
    });

    // ADD TO SHEET
    const { addedRows, updatedProducts } =
      await this.addAndSyncProductsWithSheet([
        {
          products,
          promGroupNumber: category.promId,
        },
      ]);

    // RESULT
    result.addedRowsCount = addedRows.length;
    result.updatedProducts = updatedProducts;

    const success = _.isEqual(
      _.uniq([
        result.newProductsCount,
        result.addedRowsCount,
        result.updatedProducts.length,
      ]).length,
      1,
    );
    return {
      ...result,
      success,
    };
  }

  public async loadAllNewProductsToSheet() {}
}
