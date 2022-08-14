import * as _ from 'lodash';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { MicrotronCoursesService } from '../../microtron/courses/courses.service';
import { MicrotronCategoriesService } from '../../microtron/categories/categories.service';
import { ITranslatedCategoryInConstant } from '@common/interfaces/category';
import {
  Integration,
  IntegrationCompany,
  IntegrationDocument,
} from '@schemas/integration';
import {
  CrmCategoriesService,
  TAddCategory,
} from '../../crm/categories/categories.service';
import { CategoryDocument } from '@schemas/category';
import { DataUtilsHelper, TimeHelper } from '@common/helpers';
import { TArray } from '@custom-types';
import { MicrotronProductsService } from '../../microtron/products/products.service';
import {
  CrmProductsService,
  TAddProduct,
  TUpdateProduct,
} from '../../crm/products/products.service';
import { ProductDocument } from '@schemas/product';
import { IProductFullInfo } from '@common/interfaces/product';

export type TCompareCategoriesKeys = Extract<
  keyof ITranslatedCategoryInConstant,
  'markup'
>;

export interface IChangeCategoriesActions {
  categoriesToAdd: ITranslatedCategoryInConstant[];
  categoriesToUpdate: Array<
    TArray.Pair<
      CategoryDocument,
      Pick<ITranslatedCategoryInConstant, TCompareCategoriesKeys>
    >
  >;
  categoriesToRemove: CategoryDocument[];
}

export interface ISyncCategoriesResult {
  added: CategoryDocument[];
  updated: CategoryDocument[];
  removed: CategoryDocument[];
}

export interface IChangeProductsActions {
  productsToAdd: Array<
    TArray.Pair<Pick<TAddProduct, 'category'>, IProductFullInfo[]>
  >;
  productsToUpdate: Array<TArray.Pair<ProductDocument, TUpdateProduct>>;
}

export interface ISyncProductsResult {
  added: ProductDocument[];
  updated: ProductDocument[];
}

@Injectable()
export class SyncLocalService {
  private readonly logger = new Logger(this.constructor.name);

  private readonly compareCategoriesKeys: Array<TCompareCategoriesKeys> = [
    'markup',
  ];

  constructor(
    private configService: ConfigService,
    private microtronCoursesService: MicrotronCoursesService,
    private microtronCategoriesService: MicrotronCategoriesService,
    private microtronProductsService: MicrotronProductsService,
    private crmCategoriesService: CrmCategoriesService,
    private crmProductsService: CrmProductsService,
    private dataUtilsHelper: DataUtilsHelper,
    private timeHelper: TimeHelper,
    @InjectModel(Integration.name)
    private integrationModel: Model<IntegrationDocument>,
  ) {}

  // UTILITIES PART
  public async getMicrotronIntegration() {
    this.logger.debug('Load Microtron Integration from DB');

    const microtronIntegration = await this.integrationModel
      .findOne({ company: IntegrationCompany.Microtron })
      .exec();
    if (!microtronIntegration) {
      throw new HttpException(
        'No saved microtron integration in DB',
        HttpStatus.BAD_REQUEST,
      );
    }

    return microtronIntegration;
  }

  public async addCategoriesToDB(
    data: Pick<TAddCategory, 'course' | 'integrationId'>,
    categories: ITranslatedCategoryInConstant[],
  ) {
    const { course, integrationId } = data;

    this.logger.debug('Start loading Categories to DB', {
      count: categories.length,
    });

    const addedCategoryIds: Types.ObjectId[] = [];
    for (const category of categories) {
      const addedCategory = await this.crmCategoriesService.addCategoryToDB({
        ...category,
        course,
        integrationId,
      });
      addedCategoryIds.push(addedCategory._id);
    }

    this.logger.debug('Loaded Categories to DB:', {
      count: addedCategoryIds.length,
    });

    return this.crmCategoriesService.getCategoriesByIdsFromDB(addedCategoryIds);
  }

  public async updateCategoriesInDB(
    categoriesWithData: IChangeCategoriesActions['categoriesToUpdate'],
  ) {
    this.logger.debug('Update Categories in DB:', {
      ids: _.map(categoriesWithData, (categoryData) => categoryData[0]._id),
      count: categoriesWithData.length,
    });

    const updatedCategories: CategoryDocument[] = [];
    for (const [category, data] of categoriesWithData) {
      const updatedCategory =
        await this.crmCategoriesService.updateCategoryInDB(category._id, data);
      updatedCategories.push(updatedCategory);
    }

    this.logger.debug('Updated Categories in DB:', {
      ids: _.map(updatedCategories, '_id'),
      count: updatedCategories.length,
    });

    return updatedCategories;
  }

  public async deleteCategoriesFromDB(
    categories: Array<Pick<CategoryDocument, '_id'>>,
  ) {
    this.logger.debug('Start removing Categories from DB', {
      ids: _.map(categories, '_id'),
      count: categories.length,
    });

    const deletedCategories: CategoryDocument[] = [];
    for (const category of categories) {
      const deletedCategory =
        await this.crmCategoriesService.deleteCategoryFromDB(category._id);
      deletedCategories.push(deletedCategory);
    }

    this.logger.debug('Removed Categories from DB:', {
      ids: _.map(deletedCategories, '_id'),
      count: deletedCategories.length,
    });

    return deletedCategories;
  }

  public async getChangeCategoriesActions(
    add = true,
    update = true,
    remove = true,
  ) {
    const result: IChangeCategoriesActions = {
      categoriesToAdd: [],
      categoriesToUpdate: [],
      categoriesToRemove: [],
    };

    const categoriesFromConstant =
      await this.microtronCategoriesService.getFullCategoriesInfo();
    const categoriesFromConstantMap = new Map(
      _.map(categoriesFromConstant, (category) => [category.id, category]),
    );

    const categoriesFromDB =
      await this.crmCategoriesService.getAllCategoriesFromDB();
    const categoriesFromDBMap = new Map(
      _.map(categoriesFromDB, (category) => [category.microtronId, category]),
    );

    const {
      added: addedCategoryIds,
      intersection: categoryIds,
      removed: removedCategoryIds,
    } = this.dataUtilsHelper.getDiff(
      _.map(categoriesFromConstant, 'id'),
      _.map(categoriesFromDB, 'microtronId'),
    );

    if (add) {
      if (!_.isEmpty(addedCategoryIds)) {
        result.categoriesToAdd = _.map(addedCategoryIds, (categoryId) =>
          categoriesFromConstantMap.get(categoryId),
        );

        this.logger.debug('Found Categories to add to DB:', {
          count: result.categoriesToAdd.length,
        });
      } else {
        this.logger.debug('Not found added Categories between DB and Constant');
      }
    }

    if (update) {
      if (!_.isEmpty(categoryIds)) {
        this.logger.debug(
          'Found intercepted Categories between DB and Constant:',
          {
            count: categoryIds.length,
          },
        );

        result.categoriesToUpdate = _.compact(
          _.map(categoryIds, (categoryId) => {
            const categoryFromConstant =
              categoriesFromConstantMap.get(categoryId);
            const categoryFromDB = categoriesFromDBMap.get(categoryId);

            const isEqual = _.isEqual(
              _.pick(categoryFromConstant, this.compareCategoriesKeys),
              _.pick(categoryFromDB, this.compareCategoriesKeys),
            );
            if (isEqual) return null;

            return [
              categoryFromDB,
              {
                ..._.pick(categoryFromConstant, this.compareCategoriesKeys),
                sync: false,
              },
            ];
          }),
        );

        this.logger.debug('Found Categories to update in DB:', {
          count: result.categoriesToUpdate.length,
        });
      } else {
        this.logger.debug(
          'Not found updated Categories between DB and Constant',
        );
      }
    }

    if (remove) {
      if (!_.isEmpty(removedCategoryIds)) {
        result.categoriesToRemove = _.map(removedCategoryIds, (categoryId) =>
          categoriesFromDBMap.get(categoryId),
        );

        this.logger.debug('Found Categories to remove from DB:', {
          count: result.categoriesToRemove.length,
        });
      } else {
        this.logger.debug(
          'Not found deleted Categories between DB and Constant',
        );
      }
    }

    return result;
  }

  public async makeCategoriesChangeActions(
    data: Partial<IChangeCategoriesActions>,
  ) {
    if (_.every(Object.values(data), (ids) => _.isEmpty(ids))) {
      throw new HttpException('Nothing for to do', HttpStatus.BAD_REQUEST);
    }

    this.logger.debug('Sync Categories changes with DB:', {
      add: data.categoriesToAdd.length,
      update: data.categoriesToUpdate.length,
      remove: data.categoriesToRemove.length,
    });

    const result: ISyncCategoriesResult = {
      added: [],
      updated: [],
      removed: [],
    };

    const { categoriesToAdd, categoriesToUpdate, categoriesToRemove } = data;

    if (!_.isEmpty(categoriesToAdd)) {
      const microtronIntegration = await this.getMicrotronIntegration();
      const course = await this.microtronCoursesService.getCoursesByAPI(false);

      result.added = await this.addCategoriesToDB(
        {
          course: course.bank,
          integrationId: microtronIntegration._id,
        },
        categoriesToAdd,
      );
    }

    if (!_.isEmpty(categoriesToUpdate)) {
      result.updated = await this.updateCategoriesInDB(categoriesToUpdate);
    }

    if (!_.isEmpty(categoriesToRemove)) {
      result.removed = await this.deleteCategoriesFromDB(categoriesToRemove);
    }

    return result;
  }

  public async addProductsToDB(
    data: Pick<TAddProduct, 'category'>,
    products: IProductFullInfo[],
  ) {
    const { category } = data;

    this.logger.debug('Start loading Products to DB', {
      count: products.length,
    });

    const addedProducts: ProductDocument[] = [];
    for (const product of products) {
      const addedProduct = await this.crmProductsService.addProductToDB({
        ...product,
        category,
      });
      addedProducts.push(addedProduct);
    }

    this.logger.debug('Loaded Products to DB:', {
      count: addedProducts.length,
    });

    return addedProducts;
  }

  public async updateProductsInDB(
    productsWithData: IChangeProductsActions['productsToUpdate'],
  ) {
    this.logger.debug('Update Products in DB:', {
      ids: _.map(productsWithData, (productData) => productData[0]._id),
      count: productsWithData.length,
    });

    const updatedProducts: ProductDocument[] = [];
    for (const [product, data] of productsWithData) {
      const updatedProduct = await this.crmProductsService.updateProductInDB(
        product._id,
        data,
      );
      updatedProducts.push(updatedProduct);
    }

    this.logger.debug('Updated Products in DB:', {
      ids: _.map(updatedProducts, '_id'),
      count: updatedProducts.length,
    });

    return updatedProducts;
  }

  public async getProductsToUpdateByCategories(
    categories: Array<Pick<CategoryDocument, '_id' | 'course' | 'markup'>>,
  ) {
    this.logger.debug('Get Products for Update by Categories:', {
      categories,
    });
    const productToUpdate: Array<TArray.Pair<ProductDocument, TUpdateProduct>> =
      [];

    for (const category of categories) {
      this.logger.debug('Load Products by Category from DB');
      const productsByCategory =
        await this.crmProductsService.getProductsByCategoryFromDB(category._id);

      this.logger.debug('Search Products to update');
      productToUpdate.push(
        ..._.chain(productsByCategory)
          .filter((product) => {
            const { ourPrice } = this.crmProductsService.calculateProductPrice(
              product.originalPrice,
              category,
            );

            return product.ourPrice !== ourPrice;
          })
          .map((product) => {
            return [
              product,
              {
                category: _.pick(category, ['course', 'markup']),
                originalPrice: product.originalPrice,
                sync: false,
              },
            ] as TArray.Pair<ProductDocument, TUpdateProduct>;
          })
          .value(),
      );
    }

    this.logger.debug('Products to update result:', {
      count: productToUpdate.length,
    });

    return productToUpdate;
  }

  public async getChangeProductsActions(
    categories: Array<
      Pick<CategoryDocument, '_id' | 'course' | 'markup' | 'microtronId'>
    >,
    add = true,
    update = true,
    remove = true,
  ) {
    const result: IChangeProductsActions = {
      productsToAdd: [],
      productsToUpdate: [],
    };

    const productsFromAPI =
      await this.microtronProductsService.getFullProductsInfo(
        _.map(categories, 'microtronId'),
        {
          forceLoad: true,
          forceParse: false,
        },
      );

    for (const category of categories) {
      const productsFromAPIByCategory = productsFromAPI[category.microtronId];
      const productsFromAPIByCategoryMap = new Map(
        _.map(productsFromAPIByCategory, (product) => [product.id, product]),
      );

      this.logger.debug('Load Products by Category from DB');

      const productsFromDB =
        await this.crmProductsService.getProductsByCategoryFromDB(category._id);
      const productsFromDBMap = new Map(
        _.map(productsFromDB, (product) => [product.microtronId, product]),
      );

      const {
        added: addedProductIds,
        intersection: productIds,
        removed: removedProductIds,
      } = this.dataUtilsHelper.getDiff(
        _.map(productsFromAPIByCategory, 'id'),
        _.map(productsFromDB, 'microtronId'),
      );

      if (add) {
        if (!_.isEmpty(addedProductIds)) {
          const productsToAdd = _.map(addedProductIds, (productId) =>
            productsFromAPIByCategoryMap.get(productId),
          );

          this.logger.debug('Found Products to add to DB:', {
            count: productsToAdd.length,
          });

          result.productsToAdd.push([{ category }, productsToAdd]);
        } else {
          this.logger.debug('Not found added Products between DB and API');
        }
      }

      if (update) {
        if (!_.isEmpty(productIds)) {
          this.logger.debug('Found intercepted Products between DB and API:', {
            count: productIds.length,
          });

          const productsToUpdate = _.compact(
            _.map(productIds, (productId) => {
              const productFromAPI =
                productsFromAPIByCategoryMap.get(productId);
              const productFromDB = productsFromDBMap.get(productId);

              const price =
                this.crmProductsService.getProductPrice(productFromAPI);
              const quantity =
                this.crmProductsService.getProductQuantity(productFromAPI);
              const { ourPrice } =
                this.crmProductsService.calculateProductPrice(price, category);

              const isEqual = _.isEqual(
                {
                  price,
                  quantity,
                  ourPrice,
                },
                {
                  price: productFromDB.originalPrice,
                  quantity: productFromDB.quantity,
                  ourPrice: productFromDB.ourPrice,
                },
              );
              if (isEqual && !productFromDB.deleted) return null;

              return [
                productFromDB,
                {
                  category,
                  originalPrice: price,
                  quantity: quantity,
                  deleted: false,
                  sync: false,
                },
              ] as TArray.Pair<ProductDocument, TUpdateProduct>;
            }),
          );

          this.logger.debug('Found Products to update in DB:', {
            count: productsToUpdate.length,
          });

          result.productsToUpdate.push(...productsToUpdate);
        } else {
          this.logger.debug('Not found updated Products between DB and API');
        }
      }

      if (remove) {
        if (!_.isEmpty(removedProductIds)) {
          const productsToMarkDeleted = _.map(
            removedProductIds,
            (productId) =>
              [
                productsFromDBMap.get(productId),
                {
                  sync: false,
                  deleted: true,
                },
              ] as TArray.Pair<ProductDocument, TUpdateProduct>,
          );

          this.logger.debug('Found Products to make as deleted in DB:', {
            count: productsToMarkDeleted.length,
          });

          result.productsToUpdate.push(...productsToMarkDeleted);
        } else {
          this.logger.debug('Not found deleted Products between DB and API');
        }
      }
    }

    return result;
  }

  public async makeProductsChangeActions(
    data: Partial<IChangeProductsActions>,
  ) {
    if (_.every(Object.values(data), (ids) => _.isEmpty(ids))) {
      throw new HttpException('Nothing for to do', HttpStatus.BAD_REQUEST);
    }

    this.logger.debug('Sync Products changes with DB:', {
      add: data.productsToAdd.length,
      update: data.productsToUpdate.length,
    });

    const result: ISyncProductsResult = {
      added: [],
      updated: [],
    };

    const { productsToAdd, productsToUpdate } = data;

    if (!_.isEmpty(productsToAdd)) {
      for (const [{ category }, productsWithFullInfo] of productsToAdd) {
        const addedProducts = await this.addProductsToDB(
          { category },
          productsWithFullInfo,
        );
        result.added.push(...addedProducts);
      }
    }

    if (!_.isEmpty(productsToUpdate)) {
      result.updated = await this.updateProductsInDB(productsToUpdate);
    }

    return result;
  }

  // MAIN PART - CATEGORIES
  public async loadAllCategoriesToDB() {
    const microtronIntegration = await this.getMicrotronIntegration();
    const course = await this.microtronCoursesService.getCoursesByAPI(false);

    const categories =
      await this.microtronCategoriesService.getFullCategoriesInfo();

    return this.addCategoriesToDB(
      {
        course: course.bank,
        integrationId: microtronIntegration._id,
      },
      categories,
    );
  }

  // MAIN PART - PRODUCTS
  public async loadAllProductsByCategoryToDB(microtronId: string) {
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

    const productsWithFullInfoByCategories =
      await this.microtronProductsService.getFullProductsInfo([microtronId], {
        forceLoad: true,
        forceParse: false,
      });
    const productsWithFullInfo = productsWithFullInfoByCategories[microtronId];

    return this.addProductsToDB({ category }, productsWithFullInfo);
  }

  public async loadAllProductsToDB() {}
}
