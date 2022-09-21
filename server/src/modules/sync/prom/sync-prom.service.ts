import * as _ from 'lodash';
import * as ms from 'ms';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientSession } from 'mongodb';
import { Types } from 'mongoose';
import { Category, CategoryDocument, CategoryModel } from '@schemas/category';
import { AppConstants } from '../../../app.constants';
import { SpreadsheetService } from '../../spreadsheet/spreadsheet.service';
import { DataUtilsHelper, TimeHelper } from '@common/helpers';
import { GoogleSpreadsheetRow, WorksheetGridRange } from 'google-spreadsheet';
import { Product, ProductDocument, ProductModel } from '@schemas/product';
import { PromProductsService } from '../../prom/products/products.service';
import { Product as PromProduct } from '@lib/prom';
import { SyncLocalService } from '../local/sync-local.service';
import { TObject } from '@custom-types';
import { InjectModel } from '@nestjs/mongoose';
import SPEC_CELLS_VIEW_TYPE = AppConstants.Google.Sheet.SPEC_CELLS_VIEW_TYPE;

export interface ILoadCategoriesToSheetResult {
  newCategoriesCount: number;
  addedRowsCount: number;
  updatedCategories: CategoryDocument[];
  success: boolean;
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
  '_id' | 'ourPrice' | 'quantity' | 'available'
>;

@Injectable()
export class SyncPromService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    private spreadsheetService: SpreadsheetService,
    private promProductsService: PromProductsService,
    private syncLocalService: SyncLocalService,
    private dataUtilsHelper: DataUtilsHelper,
    private timeHelper: TimeHelper,
    @InjectModel(Category.name)
    private categoryModel: CategoryModel,
    @InjectModel(Product.name)
    private productModel: ProductModel,
  ) {}

  // DEPRECATE
  public async getDeletedCategoriesFromDB(idKey = 'Ідентифікатор_групи') {
    const categoriesSheet = this.spreadsheetService.getCategoriesSheet();

    this.logger.debug('Load Category ids from Google Sheet');
    const allRows = await this.spreadsheetService.getAllRows(categoriesSheet, {
      limit: 600,
    });
    const categoryIdsInSheet = _.map(allRows, (row) => row[idKey]);

    this.logger.debug(
      'Load Category ids from DB by Category ids from Google Sheet',
    );

    // todo: session
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

  // UTILITIES PART - GENERAL
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

  // UTILITIES PART - CATEGORIES
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

  public async syncCategoriesWithSheet(
    categories: Category[],
    session?: ClientSession | null,
  ) {
    // ADD TO SHEET
    const addedRows = await this.addCategoriesToSheet(categories);

    // UPDATE IN DB
    this.logger.debug('Update Categories in DB:', {
      ids: _.map(categories, '_id'),
      count: categories.length,
    });

    const updatedCategories = await this.syncLocalService.updateCategoriesInDB(
      _.map(addedRows, (row) => [
        new Types.ObjectId(row['Ідентифікатор_групи']),
        {
          'sync.loaded': true,
          'sync.lastLoadedAt': new Date(),
          'sync.tableLine': row.rowIndex,
        },
      ]),
      session,
    );

    return {
      addedRows,
      updatedCategories,
    };
  }

  // UTILITIES PART - PRODUCTS
  public async addProductsSpecificationsToSheet(
    products: Array<Omit<ProductDocument, 'category'>>,
    rows: GoogleSpreadsheetRow[],
    chunkSize = 1700,
  ) {
    const {
      START_PROPERTIES_CELL_INDEX,
      SINGLE_PROPERTY_CELLS_SIZE,
      AVAILABLE_NUMBER_OF_PROPERTIES,
    } = AppConstants.Prom.Sheet.Product;

    const productsSheet = this.spreadsheetService.getProductsSheet();
    const productsByPromIdMap = new Map(
      _.map(products, (product) => [String(product.promId), product]),
    );

    // LOAD AND UPDATE CELLS
    const chunks = _.chunk(rows, chunkSize);
    this.logger.debug('Add Products specifications to Google Sheet cells:', {
      chunkSize,
      chunksCount: chunks.length,
      productsCount: rows.length,
    });

    let chunkIndex = 0;
    for (const chunk of chunks) {
      const chunkNumber = chunkIndex + 1;

      this.logger.debug('Process chunk:', {
        number: chunkNumber,
        size: chunk.length,
      });

      const minAddedRowIndex =
        _.minBy(chunk, (row) => row.rowIndex).rowIndex - 1;
      const maxSpecificationCount =
        _.max(
          _.map(chunk, (row) => {
            const promId = row['Код_товару'];
            const product = productsByPromIdMap.get(promId);

            return Object.keys(product.specifications).length;
          }),
        ) ?? 0;

      const rangeConfig: WorksheetGridRange = {
        startRowIndex: minAddedRowIndex,
        endRowIndex: minAddedRowIndex + chunk.length,
        startColumnIndex: START_PROPERTIES_CELL_INDEX,
        endColumnIndex:
          START_PROPERTIES_CELL_INDEX +
          maxSpecificationCount * SINGLE_PROPERTY_CELLS_SIZE +
          1,
      };

      await this.spreadsheetService.updateCells(
        productsSheet,
        rangeConfig,
        async () => {
          this.logger.debug(
            'Start setting Product specifications to Sheet cells:',
            {
              size: chunk.length,
              maxSpecificationCount,
            },
          );

          _.forEach(chunk, (row) => {
            const promId = row['Код_товару'];
            const product = productsByPromIdMap.get(promId);

            const specifications = [...Object.entries(product.specifications)];
            _.forEach(specifications, ([specKey, specValue], index) => {
              if (index >= AVAILABLE_NUMBER_OF_PROPERTIES) {
                this.logger.debug(
                  'Product has too many specifications. Skip next specifications:',
                  {
                    count: Object.keys(product.specifications).length,
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

          this.logger.debug('Set Product specifications to Sheet cells:', {
            size: chunk.length,
            maxSpecificationCount,
          });
        },
      );

      const productsLeft = Math.max(0, rows.length - chunkNumber * chunkSize);
      this.logger.debug('Chunk processed:', {
        number: chunkNumber,
        productsCount: chunk.length,
        allProductsCount: rows.length,
        productsLeft: productsLeft,
      });

      chunkIndex++;
      if (chunkNumber < chunks.length) {
        const timeToSleep = 1000 * 10;
        this.logger.log(`Sleep ${timeToSleep}s`, {
          timeMS: timeToSleep,
        });
        await this.timeHelper.sleep(timeToSleep);
      }
    }

    this.logger.debug('Added Products specifications to Google Sheet cells:', {
      productsCount: rows.length,
    });
  }

  public async addProductsToSheet(
    products: Array<
      Omit<ProductDocument, 'category'> & {
        category: Pick<CategoryDocument, '_id' | 'promId'>;
      }
    >,
  ) {
    const productsSheet = this.spreadsheetService.getProductsSheet();

    // RENAME CELLS
    await this.spreadsheetService.changeSpecCellsViewTypeInSheet(
      SPEC_CELLS_VIEW_TYPE.Increment,
    );

    // ROWS
    this.logger.debug('Build bulk rows for Google Sheet');
    const bulkRows = _.map(products, (product) =>
      this.mapEntityFields(
        AppConstants.Prom.Sheet.Product.FieldsMapping,
        AppConstants.Prom.Sheet.Product.FieldsMappingDefaults,
        product,
      ),
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

    // CELLS
    await this.addProductsSpecificationsToSheet(
      _.map(products, (product) => _.omit(product, ['category'])),
      addedRows,
    );

    // RENAME CELLS
    await this.spreadsheetService.changeSpecCellsViewTypeInSheet(
      SPEC_CELLS_VIEW_TYPE.Default,
    );

    return addedRows;
  }

  public async syncProductsWithSheet(
    products: Array<
      Omit<ProductDocument, 'category'> & {
        category: Pick<CategoryDocument, '_id' | 'promId'>;
      }
    >,
    session?: ClientSession | null,
  ) {
    const productsByPromIdMap = new Map(
      _.map(products, (product) => [String(product.promId), product]),
    );

    // ADD TO SHEET
    const addedRows = await this.addProductsToSheet(products);

    // UPDATE IN DB
    this.logger.debug('Update Products in DB:', {
      ids: _.map(products, '_id'),
      count: products.length,
    });

    const updatedProducts = await this.syncLocalService.updateProductsInDB(
      _.map(addedRows, (row) => [
        productsByPromIdMap.get(row['Код_товару'])._id,
        {
          'sync.loaded': true,
          'sync.lastLoadedAt': new Date(),
          'sync.prom': true,
          'sync.lastPromAt': new Date(),
          'sync.tableLine': row.rowIndex,
        },
      ]),
      session,
    );

    return {
      addedRows,
      updatedProducts,
    };
  }

  // UTILITIES PART - PROM + PRODUCTS
  public async processEditProductsInProm(
    productIds: Types.ObjectId[],
    bulkData: Array<TObject.MakeRequired<Partial<TEditPromProduct>, 'id'>>,
  ) {
    const chunkSize = 100;
    const sleep = ms('3s');

    const chunks = _.chunk(bulkData, chunkSize);

    this.logger.debug('Update products in Prom:', {
      productsCount: bulkData.length,
      chunksCount: chunks.length,
      chunkSize: chunkSize,
    });

    const processedIds = [];
    const errors = [];

    let chunkIndex = 0;
    for (const chunk of chunks) {
      const chunkNumber = chunkIndex + 1;

      this.logger.debug('Process chunk:', {
        number: chunkNumber,
        size: chunk.length,
      });

      const { processed_ids, errors: error } =
        await this.promProductsService.edit(chunk);

      processedIds.push(...processed_ids);
      if (!_.isEmpty(error)) errors.push(error);

      const productsLeft = bulkData.length - chunkNumber * chunkSize;
      this.logger.debug('Chunk processed:', {
        number: chunkNumber,
        processedIdsCount: processed_ids.length,
        allProductsCount: bulkData.length,
        productsLeft: productsLeft >= 0 ? productsLeft : 0,
      });

      chunkIndex++;
      if (chunkNumber < chunks.length) {
        this.logger.log(`Sleep ${ms(sleep)}`, {
          timeMS: sleep,
        });

        await this.timeHelper.sleep(sleep);
      }
    }

    const unprocessedIds = _.difference(
      _.map(productIds, (productId) => productId.toString()),
      processedIds,
    );

    this.logger.debug('Update Products in Prom result:', {
      errors,
      processedIds,
      unprocessedIds,
      count: processedIds.length,
    });

    return {
      errors,
      processedIds,
      unprocessedIds,
      productIds,
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
        status: PromProduct.ProductStatus.OnDisplay,
      };
    });

    this.logger.debug('Update Products in Prom:', {
      count: bulkData.length,
    });

    const result = await this.processEditProductsInProm(
      _.map(products, '_id'),
      bulkData,
    );

    return result;
  }

  public async syncProductsWithProm(
    products: Array<TUpdateProductInProm>,
    session?: ClientSession | null,
  ) {
    if (_.isEmpty(products)) {
      return {
        processedIds: [],
        unprocessedIds: [],
        errors: [],
        updatedProducts: [],
      };
    }

    // UPDATE IN PROM
    const { processedIds, unprocessedIds, errors } =
      await this.updateProductsInProm(products);

    // UPDATE IN DB
    this.logger.debug('Update Products in DB:', {
      ids: processedIds,
      count: processedIds.length,
    });

    const updatedProducts = await this.syncLocalService.updateProductsInDB(
      _.map(processedIds, (productId) => [
        new Types.ObjectId(productId),
        {
          'sync.prom': true,
          'sync.lastPromAt': new Date(),
        },
      ]),
      session,
    );

    return {
      processedIds,
      unprocessedIds,
      errors,
      updatedProducts,
    };
  }

  public async removeProductsFromProm(productIds: Types.ObjectId[]) {
    if (_.isEmpty(productIds)) {
      return {
        processedIds: [],
        unprocessedIds: [],
        errors: [],
        productIds: [],
      };
    }

    this.logger.debug('Build bulk data for Prom');
    const bulkData: Array<Pick<TEditPromProduct, 'id' | 'status'>> = _.map(
      productIds,
      (productId) => {
        return {
          id: productId.toString(),
          status: PromProduct.ProductStatus.Deleted,
        };
      },
    );

    this.logger.debug('Remove Products from Prom:', {
      count: bulkData.length,
    });

    const result = await this.processEditProductsInProm(productIds, bulkData);

    return result;
  }

  // MAIN PART - CATEGORIES
  public async loadAllCategoriesToSheet(session?: ClientSession | null) {
    const result: ILoadCategoriesToSheetResult = {
      newCategoriesCount: 0,
      addedRowsCount: 0,
      updatedCategories: [],
      success: true,
    };

    const { count, categories } =
      await this.categoryModel.getCategoriesForLoadToSheet(session);

    this.logger.debug('Categories for loading to Google Sheet in DB:', {
      count,
      size: categories.length,
    });

    if (count === 0) {
      return result;
    }

    // RESULT
    result.newCategoriesCount = count;

    // ADD TO SHEET
    const { addedRows, updatedCategories } = await this.syncCategoriesWithSheet(
      categories,
      session,
    );

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

  public async reloadAllCategoriesToSheet(session?: ClientSession | null) {
    const categoriesSheet = this.spreadsheetService.getCategoriesSheet();

    this.logger.debug('Clear all rows in Categories Google Sheet');
    await this.spreadsheetService.clearRows(
      categoriesSheet,
      2,
      categoriesSheet.rowCount,
    );

    this.logger.debug('Update all Categories in DB');
    await this.categoryModel.updateAllCategories(
      {
        'sync.loaded': false,
      },
      session,
    );

    return this.loadAllCategoriesToSheet(session);
  }

  // MAIN PART - PRODUCTS
  public async loadAllProductsByCategoryToSheet(
    microtronId: string,
    session?: ClientSession | null,
  ) {
    this.logger.debug('Load Category from DB:', { microtronId });

    const category = await this.categoryModel.getCategoryByMicrotronId(
      microtronId,
      session,
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

    const { count, products } =
      await this.productModel.getProductsForLoadToSheetByCategory(
        category._id,
        session,
      );

    this.logger.debug('Products for loading to Google Sheet in DB:', {
      count,
      size: products.length,
    });

    if (count === 0) {
      return result;
    }

    // RESULT
    result.newProductsCount = count;

    // ADD TO SHEET
    const { addedRows, updatedProducts } = await this.syncProductsWithSheet(
      _.map(products, (product) => ({
        ...product.toObject(),
        category,
      })),
      session,
    );

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

  public async loadAllProductsToSheet(session?: ClientSession | null) {
    const result: ILoadProductsToSheetResult = {
      newProductsCount: 0,
      addedRowsCount: 0,
      updatedProducts: [],
      success: true,
    };

    const { count, products } =
      await this.productModel.getProductsForLoadToSheet(session);

    this.logger.debug('Products for loading to Google Sheet in DB:', {
      count,
      size: products.length,
    });

    if (count === 0) {
      return result;
    }

    // RESULT
    result.newProductsCount = count;

    // ADD TO SHEET
    const { addedRows, updatedProducts } = await this.syncProductsWithSheet(
      products,
      session,
    );

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

  public async reloadAllProductsToSheet(session?: ClientSession | null) {
    const productsSheet = this.spreadsheetService.getProductsSheet();

    this.logger.debug('Clear all rows in Products Google Sheet');
    await this.spreadsheetService.clearRows(
      productsSheet,
      2,
      productsSheet.rowCount,
    );

    this.logger.debug('Update all Products in DB');
    await this.productModel.updateAllProducts(
      {
        'sync.loaded': false,
      },
      session,
    );

    return this.loadAllProductsToSheet(session);
  }

  // TESTING
  public async test() {}
}
