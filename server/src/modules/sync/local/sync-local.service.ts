import * as _ from 'lodash';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientSession } from 'mongodb';
import { Types } from 'mongoose';
import { MicrotronCoursesService } from '../../microtron/courses/courses.service';
import { MicrotronCategoriesService } from '../../microtron/categories/categories.service';
import { ITranslatedCategoryInConstant } from '@common/interfaces/category';
import {
  Category,
  CategoryDocument,
  CategoryModel,
  TAddCategoryToDB,
  TUpdateCategoryInDB,
} from '@schemas/category';
import { DataUtilsHelper, TimeHelper } from '@common/helpers';
import { TArray } from '@custom-types';
import { MicrotronProductsService } from '../../microtron/products/products.service';
import {
  Product,
  ProductDocument,
  ProductModel,
  TAddProductToDB,
  TUpdateProductInDB,
} from '@schemas/product';
import { IProductFullInfo } from '@common/interfaces/product';
import { InjectModel } from '@nestjs/mongoose';
import { Integration, IntegrationModel } from '@schemas/integration';

export interface IChangeCategoriesActions {
  categoriesToAdd: ITranslatedCategoryInConstant[];
  categoriesToUpdate: Array<TArray.Pair<Types.ObjectId, TUpdateCategoryInDB>>;
  categoriesToRemove: CategoryDocument[];
}

export interface IChangeProductsActions {
  productsToAdd: Array<
    TArray.Pair<Pick<TAddProductToDB, 'category'>, IProductFullInfo[]>
  >;
  productsToUpdate: Array<TArray.Pair<Types.ObjectId, TUpdateProductInDB>>;
  productsToRemove: ProductDocument[];
}

export interface ISyncCategoriesResult {
  added: CategoryDocument[];
  updated: CategoryDocument[];
  removed: CategoryDocument[];
}

export interface ISyncProductsResult {
  added: ProductDocument[];
  updated: ProductDocument[];
  removed: ProductDocument[];
}

export interface ISyncCourse {
  updatedCategories: CategoryDocument[];
  updatedProducts: ProductDocument[];
}

export interface ISyncMarkup {
  updatedCategories: CategoryDocument[];
  updatedProducts: ProductDocument[];
}

export interface IActualizeCategories {
  addedCategories: CategoryDocument[];
  removedCategories: CategoryDocument[];
  addedProducts: ProductDocument[];
  removedProducts: ProductDocument[];
}

@Injectable()
export class SyncLocalService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    private microtronCoursesService: MicrotronCoursesService,
    private microtronCategoriesService: MicrotronCategoriesService,
    private microtronProductsService: MicrotronProductsService,
    private dataUtilsHelper: DataUtilsHelper,
    private timeHelper: TimeHelper,
    @InjectModel(Integration.name)
    private integrationModel: IntegrationModel,
    @InjectModel(Category.name)
    private categoryModel: CategoryModel,
    @InjectModel(Product.name)
    private productModel: ProductModel,
  ) {}

  // UTILITIES PART - CATEGORIES
  public async addCategoriesToDB(
    data: Pick<TAddCategoryToDB, 'course' | 'integrationId'>,
    categories: ITranslatedCategoryInConstant[],
    session?: ClientSession | null,
  ) {
    const { course, integrationId } = data;

    this.logger.debug('Start loading Categories to DB', {
      count: categories.length,
    });

    const addedCategoryIds: Types.ObjectId[] = [];
    for (const category of categories) {
      const addedCategory = await this.categoryModel.addCategory(
        {
          ...category,
          course,
          integrationId,
        },
        session,
      );
      addedCategoryIds.push(addedCategory._id);
    }

    this.logger.debug('Loaded Categories to DB:', {
      count: addedCategoryIds.length,
    });

    return this.categoryModel.getCategoriesByIds(addedCategoryIds, session);
  }

  public async updateCategoriesInDB(
    categoriesWithData: IChangeCategoriesActions['categoriesToUpdate'],
    session?: ClientSession | null,
  ) {
    this.logger.debug('Update Categories in DB:', {
      ids: _.map(categoriesWithData, (categoryData) => categoryData[0]._id),
      count: categoriesWithData.length,
    });

    const updatedCategories: CategoryDocument[] = [];
    for (const [category, data] of categoriesWithData) {
      const updatedCategory = await this.categoryModel.updateCategory(
        category._id,
        data,
        session,
      );
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
    session?: ClientSession | null,
  ) {
    this.logger.debug('Start removing Categories from DB', {
      ids: _.map(categories, '_id'),
      count: categories.length,
    });

    const deletedCategories: CategoryDocument[] = [];
    for (const category of categories) {
      const deletedCategory = await this.categoryModel.deleteCategory(
        category._id,
        session,
      );
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
    session?: ClientSession | null,
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

    const categoriesFromDB = await this.categoryModel.getAllCategories(session);
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
              _.pick(categoryFromConstant, ['markup']),
              _.pick(categoryFromDB, ['markup']),
            );
            if (isEqual) return null;

            return [
              categoryFromDB._id,
              {
                ..._.pick(categoryFromConstant, ['markup']),
                'sync.localAt': new Date(),
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
    session?: ClientSession | null,
  ) {
    const result: ISyncCategoriesResult = {
      added: [],
      updated: [],
      removed: [],
    };

    if (_.every(Object.values(data), (ids) => _.isEmpty(ids))) {
      this.logger.debug('Nothing for make Categories changes');
      return result;
    }

    this.logger.debug('Sync Categories changes with DB:', {
      add: data.categoriesToAdd.length,
      update: data.categoriesToUpdate.length,
      remove: data.categoriesToRemove.length,
    });

    const { categoriesToAdd, categoriesToUpdate, categoriesToRemove } = data;

    if (!_.isEmpty(categoriesToAdd)) {
      const microtronIntegration =
        await this.integrationModel.getMicrotronIntegration();
      const course = await this.microtronCoursesService.getCoursesByAPI(true);

      result.added = await this.addCategoriesToDB(
        {
          course: course.bank,
          integrationId: microtronIntegration._id,
        },
        categoriesToAdd,
        session,
      );
    }

    if (!_.isEmpty(categoriesToUpdate)) {
      result.updated = await this.updateCategoriesInDB(
        categoriesToUpdate,
        session,
      );
    }

    if (!_.isEmpty(categoriesToRemove)) {
      result.removed = await this.deleteCategoriesFromDB(
        categoriesToRemove,
        session,
      );
    }

    return result;
  }

  // UTILITIES PART - PRODUCTS
  public async addProductsToDB(
    data: Pick<TAddProductToDB, 'category'>,
    products: IProductFullInfo[],
    session?: ClientSession | null,
  ) {
    const { category } = data;

    this.logger.debug('Start loading Products to DB', {
      count: products.length,
    });

    const addedProducts: ProductDocument[] = [];
    for (const product of products) {
      const addedProduct = await this.productModel.addProduct(
        {
          ...product,
          category,
        },
        session,
      );
      addedProducts.push(addedProduct);
    }

    this.logger.debug('Loaded Products to DB:', {
      count: addedProducts.length,
    });

    return addedProducts;
  }

  public async updateProductsInDB(
    productsWithData: IChangeProductsActions['productsToUpdate'],
    session?: ClientSession | null,
  ) {
    this.logger.debug('Update Products in DB:', {
      ids: _.map(productsWithData, (productData) => productData[0]._id),
      count: productsWithData.length,
    });

    const updatedProducts: ProductDocument[] = [];
    for (const [product, data] of productsWithData) {
      const updatedProduct = await this.productModel.updateProduct(
        product._id,
        data,
        session,
      );
      updatedProducts.push(updatedProduct);
    }

    this.logger.debug('Updated Products in DB:', {
      ids: _.map(updatedProducts, '_id'),
      count: updatedProducts.length,
    });

    return updatedProducts;
  }

  public async deleteProductsFromDB(
    products: Array<Pick<ProductDocument, '_id'>>,
    session?: ClientSession | null,
  ) {
    this.logger.debug('Start removing Products from DB', {
      ids: _.map(products, '_id'),
      count: products.length,
    });

    const deletedProducts: ProductDocument[] = [];
    for (const product of products) {
      const deletedProduct = await this.productModel.deleteProduct(
        product._id,
        session,
      );
      deletedProducts.push(deletedProduct);
    }

    this.logger.debug('Removed Products from DB:', {
      ids: _.map(deletedProducts, '_id'),
      count: deletedProducts.length,
    });

    return deletedProducts;
  }

  public async getProductsToUpdateByCategories(
    categories: Array<Pick<CategoryDocument, '_id' | 'course' | 'markup'>>,
    session?: ClientSession | null,
  ) {
    this.logger.debug('Get Products for Update by Categories:', {
      categories: _.map(categories, (category) =>
        _.pick(category, ['_id', 'course', 'markup']),
      ),
    });
    const productToUpdate: IChangeProductsActions['productsToUpdate'] = [];

    let allProductsCount = 0;
    let allExcludedProductsFromUpdateCount = 0;
    for (const category of categories) {
      this.logger.debug('Load Products by Category from DB:', {
        categoryId: category._id,
      });
      const productsByCategory =
        await this.productModel.getProductsByCategories(
          [category._id],
          session,
        );

      const productsToUpdateByCategory = _.chain(productsByCategory)
        .filter((product) => {
          const { ourPrice } = this.productModel.calculateProductPrice(
            product.originalPrice,
            product.originalPriceCurrency,
            category,
          );

          return product.ourPrice !== ourPrice;
        })
        .map((product) => {
          return [
            product._id,
            {
              category: _.pick(category, ['course', 'markup']),
              'sync.localAt': new Date(),
              'sync.prom': false,
            },
          ] as TArray.Pair<Types.ObjectId, TUpdateProductInDB>;
        })
        .value();
      productToUpdate.push(...productsToUpdateByCategory);

      const excludedProductsFromUpdateCount =
        productsByCategory.length - productsToUpdateByCategory.length;

      allProductsCount += productsByCategory.length;
      allExcludedProductsFromUpdateCount += excludedProductsFromUpdateCount;

      this.logger.debug('Search Products to update result:', {
        categoryId: category._id,
        productsByCategoryCount: productsByCategory.length,
        productsToUpdateByCategoryCount: productsToUpdateByCategory.length,
        excludedProductsToUpdateCount: excludedProductsFromUpdateCount,
      });
    }

    this.logger.debug('Products to update result:', {
      allProductsCount,
      allExcludedProductsFromUpdateCount,
      productsToUpdateCount: productToUpdate.length,
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
    session?: ClientSession | null,
  ) {
    const result: IChangeProductsActions = {
      productsToAdd: [],
      productsToUpdate: [],
      productsToRemove: [],
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

      const productsFromDB = await this.productModel.getProductsByCategories(
        [category._id],
        session,
      );
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

              const price = this.productModel.getProductPrice(productFromAPI);
              const quantity =
                this.productModel.getProductQuantity(productFromAPI);

              const currency = productFromAPI.currency;
              const { ourPrice } = this.productModel.calculateProductPrice(
                price,
                currency,
                category,
              );

              const isEqual = _.isEqual(
                {
                  price,
                  currency,
                  quantity,
                  ourPrice,
                },
                {
                  price: productFromDB.originalPrice,
                  currency: productFromDB.originalPriceCurrency,
                  quantity: productFromDB.quantity,
                  ourPrice: productFromDB.ourPrice,
                },
              );
              if (isEqual) return null;

              return [
                productFromDB._id,
                {
                  category,
                  originalPrice: price,
                  originalPriceCurrency: currency,
                  quantity: quantity,
                  'sync.localAt': new Date(),
                  'sync.prom': false,
                },
              ] as TArray.Pair<Types.ObjectId, TUpdateProductInDB>;
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
          const productsToRemove = _.map(removedProductIds, (productId) =>
            productsFromDBMap.get(productId),
          );

          this.logger.debug('Found Products to remove from DB:', {
            count: productsToRemove.length,
          });

          result.productsToRemove.push(...productsToRemove);
        } else {
          this.logger.debug('Not found deleted Products between DB and API');
        }
      }
    }

    return result;
  }

  public async makeProductsChangeActions(
    data: Partial<IChangeProductsActions>,
    session?: ClientSession | null,
  ) {
    const result: ISyncProductsResult = {
      added: [],
      updated: [],
      removed: [],
    };

    if (_.every(Object.values(data), (ids) => _.isEmpty(ids))) {
      this.logger.debug('Nothing for make Products changes');
      return result;
    }

    this.logger.debug('Sync Products changes with DB:', {
      add: data.productsToAdd.length,
      update: data.productsToUpdate.length,
    });

    const { productsToAdd, productsToUpdate, productsToRemove } = data;

    if (!_.isEmpty(productsToAdd)) {
      for (const [{ category }, productsWithFullInfo] of productsToAdd) {
        const addedProducts = await this.addProductsToDB(
          { category },
          productsWithFullInfo,
          session,
        );
        result.added.push(...addedProducts);
      }
    }

    if (!_.isEmpty(productsToUpdate)) {
      result.updated = await this.updateProductsInDB(productsToUpdate, session);
    }

    if (!_.isEmpty(productsToRemove)) {
      result.removed = await this.deleteProductsFromDB(
        productsToRemove,
        session,
      );
    }

    return result;
  }

  // MAIN PART - CATEGORIES
  public async loadAllCategoriesToDB(session?: ClientSession | null) {
    const categories =
      await this.microtronCategoriesService.getFullCategoriesInfo();

    const { added } = await this.makeCategoriesChangeActions(
      {
        categoriesToAdd: categories,
        categoriesToRemove: [],
        categoriesToUpdate: [],
      },
      session,
    );

    return added;
  }

  // MAIN PART - PRODUCTS
  public async loadAllProductsByCategoryToDB(
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

    const productsWithFullInfoByCategories =
      await this.microtronProductsService.getFullProductsInfo([microtronId], {
        forceLoad: true,
        forceParse: false,
      });
    const productsWithFullInfo = productsWithFullInfoByCategories[microtronId];

    return this.addProductsToDB({ category }, productsWithFullInfo, session);
  }

  public async loadAllProductsToDB(session?: ClientSession | null) {
    this.logger.debug('Load All Categories from DB');

    const categories = await this.categoryModel.getAllCategories(session);
    this.logger.debug('Loaded Categories from DB:', {
      count: categories.length,
    });

    const productsWithFullInfoByCategories =
      await this.microtronProductsService.getFullProductsInfo(
        _.map(categories, 'microtronId'),
        {
          forceLoad: true,
          forceParse: false,
        },
      );
    const allProductsCount = _.flattenDeep(
      Object.values(productsWithFullInfoByCategories),
    ).length;

    const loadedProducts: ProductDocument[] = [];

    let categoryIndex = 0;
    for (const category of categories) {
      const categoryNumber = categoryIndex + 1;

      const productsWithFullInfo =
        productsWithFullInfoByCategories[category.microtronId];

      this.logger.debug('Process Category:', {
        number: categoryNumber,
        id: category._id,
        name: category.name,
        products: productsWithFullInfo.length,
      });

      if (!_.isEmpty(productsWithFullInfo)) {
        const addedProducts = await this.addProductsToDB(
          { category },
          productsWithFullInfo,
          session,
        );
        loadedProducts.push(...addedProducts);

        if (addedProducts.length >= 20) {
          this.logger.log('Sleep 2s');
          await this.timeHelper.sleep(2000);
        }
      }

      this.logger.debug('Category processed:', {
        id: category._id,
        name: category.name,
        empty: _.isEmpty(productsWithFullInfo),
        products: productsWithFullInfo.length,
        categoriesLeft: Math.max(0, categories.length - categoryNumber),
        productsLeft: Math.max(0, allProductsCount - loadedProducts.length),
      });

      categoryIndex++;
    }

    this.logger.debug('Loaded Products to DB:', {
      count: loadedProducts.length,
    });

    return loadedProducts;
  }

  public async actualizeProductsByCategory(
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

    const changeProductsActions = await this.getChangeProductsActions(
      [category],
      true,
      true,
      true,
      session,
    );
    const result = await this.makeProductsChangeActions(
      changeProductsActions,
      session,
    );

    this.logger.debug('Result of actualize Products by Category:', {
      addedProducts: result.added.length,
      updatedProducts: result.updated.length,
      removedProducts: result.removed.length,
    });

    return result;
  }

  public async actualizeAllProducts(session?: ClientSession | null) {
    this.logger.debug('Load All Categories from DB');

    const categories = await this.categoryModel.getAllCategories(session);
    this.logger.debug('Loaded Categories from DB:', {
      count: categories.length,
    });

    const changeProductsActions = await this.getChangeProductsActions(
      categories,
      true,
      true,
      true,
      session,
    );
    const result = await this.makeProductsChangeActions(
      changeProductsActions,
      session,
    );

    this.logger.debug('Result of actualize All Products:', {
      addedProducts: result.added.length,
      updatedProducts: result.updated.length,
      removedProducts: result.removed.length,
    });

    return result;
  }

  // MAIN PART - CATEGORIES + PRODUCTS
  public async syncCourse(session?: ClientSession | null) {
    const result: ISyncCourse = {
      updatedCategories: [],
      updatedProducts: [],
    };

    const course = await this.microtronCoursesService.getCoursesByAPI(true);
    this.logger.debug('Loaded new Course:', {
      course,
    });

    this.logger.debug('Load all Categories with another Course');

    const categories = await this.categoryModel
      .find({
        course: {
          $ne: course.bank,
        },
      })
      .session(session)
      .exec();
    this.logger.debug('Loaded Categories with another Course:', {
      count: categories.length,
    });

    if (_.isEmpty(categories)) {
      this.logger.debug(
        'Categories is empty. Nothing for update. Return empty result',
      );
      return result;
    }

    for (const category of categories) {
      // single category but in array view
      const updatedCategories = await this.updateCategoriesInDB(
        [
          [
            category._id,
            {
              course: course.bank,
              'sync.localAt': new Date(),
            },
          ],
        ],
        session,
      );
      result.updatedCategories.push(...updatedCategories);

      const productsToUpdate = await this.getProductsToUpdateByCategories(
        updatedCategories,
        session,
      );
      if (!_.isEmpty(productsToUpdate)) {
        const updatedProducts = await this.updateProductsInDB(
          productsToUpdate,
          session,
        );
        result.updatedProducts.push(...updatedProducts);
      }
    }

    this.logger.debug('Result of sync Course:', {
      updatedCategoriesCount: result.updatedCategories.length,
      updatedProductsCount: result.updatedProducts.length,
    });

    return result;
  }

  public async syncMarkup(session?: ClientSession | null) {
    const result: ISyncMarkup = {
      updatedCategories: [],
      updatedProducts: [],
    };

    const { categoriesToUpdate } = await this.getChangeCategoriesActions(
      false,
      true,
      false,
      session,
    );
    if (_.isEmpty(categoriesToUpdate)) {
      this.logger.debug('Categories to update is empty. Return empty result');
      return result;
    }

    for (const categoryToUpdate of categoriesToUpdate) {
      // single category but in array view
      const updatedCategories = await this.updateCategoriesInDB(
        [categoryToUpdate],
        session,
      );
      result.updatedCategories.push(...updatedCategories);

      const productsToUpdate = await this.getProductsToUpdateByCategories(
        updatedCategories,
        session,
      );
      if (!_.isEmpty(productsToUpdate)) {
        const updatedProducts = await this.updateProductsInDB(
          productsToUpdate,
          session,
        );
        result.updatedProducts.push(...updatedProducts);
      }
    }

    this.logger.debug('Result of sync Markup:', {
      updatedCategoriesCount: result.updatedCategories.length,
      updatedProductsCount: result.updatedProducts.length,
    });

    return result;
  }

  public async actualizeCategories(session?: ClientSession | null) {
    const result: IActualizeCategories = {
      addedCategories: [],
      removedCategories: [],
      addedProducts: [],
      removedProducts: [],
    };

    const { categoriesToAdd, categoriesToRemove } =
      await this.getChangeCategoriesActions(true, false, true, session);
    if (_.isEmpty(categoriesToAdd) && _.isEmpty(categoriesToRemove)) {
      this.logger.debug(
        'Categories to add and remove is empty. Return empty result',
      );
      return result;
    }

    if (!_.isEmpty(categoriesToAdd)) {
      this.logger.debug('Process add Categories:', {
        count: categoriesToAdd.length,
      });

      const microtronIntegration =
        await this.integrationModel.getMicrotronIntegration();
      const course = await this.microtronCoursesService.getCoursesByAPI(true);

      for (const categoryToAdd of categoriesToAdd) {
        const addedCategories = await this.addCategoriesToDB(
          {
            course: course.bank,
            integrationId: microtronIntegration._id,
          },
          [categoryToAdd],
          session,
        );

        // RESULT
        result.addedCategories.push(...addedCategories);

        const changeProductsActions = await this.getChangeProductsActions(
          addedCategories,
          true,
          false,
          false,
          session,
        );
        const { added } = await this.makeProductsChangeActions(
          changeProductsActions,
          session,
        );

        // RESULT
        result.addedProducts.push(...added);
      }
    }

    if (!_.isEmpty(categoriesToRemove)) {
      this.logger.debug('Process remove Categories:', {
        count: categoriesToAdd.length,
      });

      for (const categoryToRemove of categoriesToRemove) {
        const removedCategories = await this.deleteCategoriesFromDB(
          [categoryToRemove],
          session,
        );

        // RESULT
        result.removedCategories.push(...removedCategories);

        const productsByCategory =
          await this.productModel.getProductsByCategories(
            [categoryToRemove._id],
            session,
          );
        const removedProducts = await this.deleteProductsFromDB(
          productsByCategory,
          session,
        );

        // RESULT
        result.removedProducts.push(...removedProducts);
      }
    }

    this.logger.debug('Result of actualize Categories:', {
      addedCategories: result.addedCategories.length,
      removedCategories: result.removedCategories.length,
      addedProducts: result.addedProducts.length,
      removedProducts: result.removedProducts.length,
    });

    return result;
  }

  // TESTING
  public async test() {}
}
