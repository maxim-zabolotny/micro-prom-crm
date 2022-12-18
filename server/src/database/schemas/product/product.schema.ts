import * as _ from 'lodash';
import { ClientSession } from 'mongodb';
import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Document,
  Model,
  Schema as MongooseSchema,
  SchemaTypes,
  Types,
  UpdateWriteOpResult,
} from 'mongoose';
import { Category, CategoryDocument } from '@schemas/category';
import { Types as MicrotronTypes } from '@lib/microtron';
import {
  ProductSync,
  ProductSyncSchema,
} from '@schemas/product/product-sync.schema';
import { HttpException, HttpStatus, Logger, Type } from '@nestjs/common';
import { DataGenerateHelper } from '@common/helpers';
import { IProductCostInfo, IProductFullInfo } from '@common/interfaces/product';
import { AppConstants } from '../../../app.constants';
import { Data } from '../../../data';

// TYPES
export type TProductTranslate = Pick<Product, 'name' | 'description'>;

export type TAddProductToDB = Omit<IProductFullInfo, 'categoryId'> & {
  category: Pick<CategoryDocument, '_id' | 'microtronId' | 'course' | 'markup'>;
};

export type TUpdateProductInDB = Partial<
  Pick<
    Product,
    'sitePrice' | 'originalPrice' | 'originalPriceCurrency' | 'quantity'
  > & {
    'sync.localAt': ProductSync['localAt'];
    'sync.prom': ProductSync['prom'];
    'sync.lastPromAt': ProductSync['lastPromAt'];
    'sync.loaded': ProductSync['loaded'];
    'sync.lastLoadedAt': ProductSync['lastLoadedAt'];
    'sync.tableLine': ProductSync['tableLine'];
  } & {
    category: Pick<Category, 'course' | 'markup'>;
  }
>;

// MONGOOSE
export type ProductDocument = Product & Document;

export type ProductModel = Model<ProductDocument> & TStaticMethods;

@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({
    type: raw({
      _id: false,
      name: { type: String, required: true },
      description: { type: String, required: true },
    }),
    required: true,
  })
  translate: TProductTranslate;

  @Prop({ type: String, required: true })
  brand: string;

  @Prop({
    type: SchemaTypes.Mixed,
    required: true,
  })
  specifications: Record<string, string>;

  @Prop({ type: Number, required: true })
  sitePrice: number;

  @Prop({ type: Number, required: true })
  siteMarkup: number;

  @Prop({ type: String, required: true })
  originalPriceCurrency: MicrotronTypes.Currency;

  @Prop({ type: Number, required: true })
  originalPrice: number;

  @Prop({ type: Number, required: true })
  ourPrice: number;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: Number, required: true })
  warranty: number;

  @Prop({ type: String })
  vendorCode: string;

  @Prop({ type: String })
  UKTZED: string;

  @Prop({ type: String, required: true })
  url: string;

  @Prop({ type: [String], required: true })
  images: string[];

  @Prop({ type: Boolean, required: true })
  new: boolean;

  @Prop({ type: Boolean, required: true })
  available: boolean;

  @Prop({ type: ProductSyncSchema, required: true })
  sync: ProductSync;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'categories', required: true })
  category: Category;

  @Prop({ type: Number, required: true, unique: true })
  microtronId: number;

  @Prop({
    type: SchemaTypes.Decimal128,
    required: true,
    unique: true,
    get: (v) => parseInt(v.toString()),
  })
  promId: number;
}

export const ProductSchema = SchemaFactory.createForClass(
  Product,
) as unknown as MongooseSchema<Type<Product>, ProductModel>;

// CUSTOM TYPES
type TStaticMethods = {
  // UTILITIES
  getProductPrice: (
    this: ProductModel,
    product: Pick<IProductFullInfo, 'price' | 'price_s'>,
  ) => number;
  getProductQuantity: (
    this: ProductModel,
    product: Pick<IProductFullInfo, 'quantity' | 'quantity_s'>,
  ) => number;
  getProductSpecifications: (
    this: ProductModel,
    product: Pick<IProductFullInfo, 'warranty'> & {
      parse: Pick<IProductFullInfo['parse'], 'specifications' | 'new'>;
    },
  ) => Record<string, string>;
  calculateProductPrice: (
    this: ProductModel,
    originalPrice: number,
    currency: MicrotronTypes.Currency,
    category: Pick<Category, 'course' | 'markup'>,
  ) => { rawPrice: number; ourPrice: number };
  calculateSiteProductMarkup: (
    this: ProductModel,
    rawPrice: number,
    sitePrice: number,
  ) => number;
  getProductCostInfo: (
    this: ProductModel,
    product: Pick<
      IProductFullInfo,
      'currency' | 'price' | 'price_s' | 'quantity' | 'quantity_s'
    > & {
      category: Pick<Category, 'course' | 'markup'>;
      parse?: Pick<IProductFullInfo['parse'], 'cost'>;
    },
  ) => IProductCostInfo;
  // MAIN
  findProducts: (
    this: ProductModel,
    data: Partial<
      Pick<Product, 'name' | 'microtronId' | 'promId'> & {
        loadedOnProm: boolean;
      }
    >,
    pagination: { limit: number; offset: number },
    session?: ClientSession | null,
  ) => Promise<ProductDocument[]>;
  getAllProducts: (
    this: ProductModel,
    session?: ClientSession | null,
  ) => Promise<ProductDocument[]>;
  getProductsByCategories: (
    this: ProductModel,
    categoryIds: Types.ObjectId[],
    session?: ClientSession | null,
  ) => Promise<ProductDocument[]>;
  getCategoriesWithProductsCount: (
    this: ProductModel,
    session?: ClientSession | null,
  ) => Promise<Array<CategoryDocument & { productsCount: number }>>;
  getProductsForLoadToSheet: (
    this: ProductModel,
    session?: ClientSession | null,
  ) => Promise<{
    products: Array<
      Omit<ProductDocument, 'category'> & {
        category: Pick<CategoryDocument, '_id' | 'promId'>;
      }
    >;
    count: number;
  }>;
  getProductsForLoadToSheetByCategory: (
    this: ProductModel,
    categoryId: Types.ObjectId,
    session?: ClientSession | null,
  ) => Promise<{
    products: ProductDocument[];
    count: number;
  }>;
  getProductsForSyncWithProm: (
    this: ProductModel,
    options?: {
      categories?: Types.ObjectId[];
      products?: Types.ObjectId[];
      session?: ClientSession | null;
    },
  ) => Promise<ProductDocument[]>;
  addProduct: (
    this: ProductModel,
    productData: TAddProductToDB,
    session?: ClientSession | null,
  ) => Promise<ProductDocument>;
  updateProduct: (
    this: ProductModel,
    productId: Types.ObjectId,
    data: TUpdateProductInDB,
    session?: ClientSession | null,
  ) => Promise<ProductDocument>;
  updateAllProducts: (
    this: ProductModel,
    data: Partial<TUpdateProductInDB>,
    session?: ClientSession | null,
  ) => Promise<UpdateWriteOpResult>;
  deleteProduct: (
    this: ProductModel,
    productId: Types.ObjectId,
    session?: ClientSession | null,
  ) => Promise<ProductDocument>;
};

// STATIC METHODS IMPLEMENTATION
const productLogger = new Logger('ProductModel');
const dataGenerateHelper = new DataGenerateHelper();

// UTILITIES
ProductSchema.statics.getProductPrice = function (product) {
  return _.isNumber(product.price) ? product.price : product.price_s;
} as TStaticMethods['getProductPrice'];

ProductSchema.statics.getProductQuantity = function (product) {
  return _.isNumber(product.quantity) ? product.quantity : product.quantity_s;
} as TStaticMethods['getProductQuantity'];

ProductSchema.statics.getProductSpecifications = function (product) {
  const ProductConstants = AppConstants.Prom.Sheet.Product;

  const specifications = _.reduce(
    product.parse.specifications,
    (acc, value, key) => {
      acc[String(key)] = String(value);
      return acc;
    },
    {},
  );

  if (
    product.warranty > 0 &&
    !specifications[ProductConstants.SpecialSpecificationKeys.GuaranteeTerm]
  ) {
    specifications[
      ProductConstants.SpecialSpecificationKeys.GuaranteeTerm
    ] = `${product.warranty}`;
  }

  if (!specifications[ProductConstants.SpecialSpecificationKeys.State]) {
    specifications[ProductConstants.SpecialSpecificationKeys.State] = product
      .parse.new
      ? 'Новое'
      : 'Б/У';
  }

  return Object.fromEntries(
    _.sortBy(Object.entries(specifications), ([key]) => key),
  );
} as TStaticMethods['getProductSpecifications'];

ProductSchema.statics.calculateProductPrice = function (
  originalPrice,
  currency,
  category,
) {
  const course = currency === MicrotronTypes.Currency.UAH ? 1 : category.course;

  const rawPrice = originalPrice * course;
  const onePercentFromRawPrice = rawPrice / 100;

  const markupAmount = onePercentFromRawPrice * category.markup;
  const ourPrice = rawPrice + markupAmount;

  return {
    rawPrice: Number(rawPrice.toFixed(3)),
    ourPrice: Math.ceil(Number(ourPrice.toFixed(3))),
  };
} as TStaticMethods['calculateProductPrice'];

ProductSchema.statics.calculateSiteProductMarkup = function (
  rawPrice,
  sitePrice,
) {
  const onePercentFromRawPrice = rawPrice / 100;
  const siteMarkup = (sitePrice - rawPrice) / onePercentFromRawPrice;

  return Number(siteMarkup.toFixed(3));
} as TStaticMethods['calculateSiteProductMarkup'];

ProductSchema.statics.getProductCostInfo = function (product) {
  const result: Record<string, number> = {};

  result.price = this.getProductPrice(product);
  result.quantity = this.getProductQuantity(product);

  const { rawPrice, ourPrice } = this.calculateProductPrice(
    result.price,
    product.currency,
    product.category,
  );

  result.rawPrice = rawPrice;
  result.ourPrice = ourPrice;

  if (product.parse) {
    result.siteMarkup = this.calculateSiteProductMarkup(
      result.rawPrice,
      product.parse.cost.price,
    );
  }

  return {
    ...result,
    currency: product.currency,
  };
} as TStaticMethods['getProductCostInfo'];

// MAIN
ProductSchema.statics.findProducts = async function (
  data,
  { offset, limit },
  session,
) {
  const searchData: Array<Record<string, unknown>> = [];

  if (!_.isEmpty(data.name)) {
    searchData.push({
      $or: [
        {
          name: {
            $regex: new RegExp(data.name),
            $options: 'i',
          },
        },
        {
          'translate.name': {
            $regex: new RegExp(data.name),
            $options: 'i',
          },
        },
      ],
    });
  }

  if ('loadedOnProm' in data) {
    searchData.push({ 'sync.loaded': data.loadedOnProm });
  }

  if (_.isNumber(data.microtronId)) {
    searchData.push({ microtronId: data.microtronId });
  }

  if (_.isNumber(data.promId)) {
    searchData.push({ promId: data.promId });
  }

  const filter = searchData.length > 0 ? { $and: searchData } : {};
  return this.find(filter)
    .limit(limit)
    .skip(offset)
    .sort({ updatedAt: -1 })
    .session(session)
    .exec();
} as TStaticMethods['findProducts'];

ProductSchema.statics.getAllProducts = async function (session) {
  return this.find().session(session).exec();
} as TStaticMethods['getAllProducts'];

ProductSchema.statics.getProductsByCategories = async function (
  categoryIds,
  session,
) {
  return this.find({ category: { $in: categoryIds } })
    .session(session)
    .exec();
} as TStaticMethods['getProductsByCategories'];

ProductSchema.statics.getCategoriesWithProductsCount = async function (
  session,
) {
  // return this.categoryModel
  //   .aggregate([
  //     {
  //       $lookup: {
  //         from: 'products',
  //         localField: '_id',
  //         foreignField: 'category',
  //         pipeline: [{ $project: { _id: 1 } }],
  //         as: 'products',
  //       },
  //     },
  //     { $set: { productsCount: { $size: '$products' } } },
  //     { $unset: ['products'] },
  //     { $sort: { productsCount: -1 } },
  //   ])
  //   .exec();

  // faster than category version
  return this.aggregate([
    {
      $group: {
        _id: '$category',
        productsCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'categories',
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [{ $arrayElemAt: ['$categories', 0] }, '$$ROOT'],
        },
      },
    },
    { $unset: 'categories' },
    { $sort: { productsCount: -1 } },
  ])
    .session(session)
    .exec();
} as TStaticMethods['getCategoriesWithProductsCount'];

ProductSchema.statics.getProductsForLoadToSheet = async function (session) {
  const products = await this.aggregate([
    {
      $match: { 'sync.loaded': false },
    },
    {
      $lookup: {
        from: 'categories',
        let: { category: '$category' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$$category', '$_id'] },
            },
          },
          {
            $project: {
              _id: 1,
              promId: 1,
            },
          },
        ],
        as: 'category',
      },
    },
    {
      $unwind: '$category',
    },
  ])
    .session(session)
    .exec();

  return {
    products,
    count: products.length,
  };
} as TStaticMethods['getProductsForLoadToSheet'];

ProductSchema.statics.getProductsForLoadToSheetByCategory = async function (
  categoryId,
  session,
) {
  const products = await this.find({
    category: categoryId,
    'sync.loaded': false,
  })
    .session(session)
    .exec();

  return {
    products,
    count: products.length,
  };
} as TStaticMethods['getProductsForLoadToSheetByCategory'];

ProductSchema.statics.getProductsForSyncWithProm = async function (options) {
  const searchOptions = {
    'sync.loaded': true,
    'sync.prom': false,
  };

  if (options?.categories) {
    searchOptions['category'] = {
      $in: options.categories,
    };
  }

  if (options?.products) {
    searchOptions['_id'] = {
      $in: options.products,
    };
  }

  return this.find(searchOptions).session(options?.session).exec();
} as TStaticMethods['getProductsForSyncWithProm'];

ProductSchema.statics.addProduct = async function (productData, session) {
  productLogger.debug('Process add Product:', {
    id: productData.id,
    name: productData.name,
    categoryMicrotronId: productData.category.microtronId,
  });

  productLogger.debug('Find product');
  const oldProduct = await this.findOne({ microtronId: productData.id })
    .session(session)
    .exec();
  if (oldProduct) {
    productLogger.error('Product already exist. Return old version', {
      productByAPI: productData,
      productByDB: oldProduct,
    });

    await Data.Logs.push({
      type: 'Duplicate',
      message: 'Product already exist',
      time: new Date(),
      data: {
        productByAPI: productData,
        productByDB: oldProduct,
      },
    });

    return oldProduct;
  }

  const { parse, translate, category } = productData;

  const { price, quantity, ourPrice, siteMarkup } = this.getProductCostInfo({
    ...productData,
    category,
  });

  const specifications = this.getProductSpecifications(productData);

  const available = quantity > 0;

  const product = new this({
    name: productData.name,
    description: parse.description,
    translate: translate,
    brand: productData.brand,
    specifications: specifications,
    sitePrice: parse.cost.price,
    siteMarkup: siteMarkup,
    originalPrice: price,
    originalPriceCurrency: productData.currency,
    ourPrice: ourPrice,
    quantity: quantity,
    warranty: productData.warranty,
    vendorCode: productData.vendorCode,
    UKTZED: productData.UKTZED,
    url: productData.url,
    images: productData.images,
    new: parse.new,
    available: available,
    category: category._id,
    microtronId: productData.id,
    promId: dataGenerateHelper.randomNumber(1, 9, 19),
    sync: {
      localAt: new Date(),
    },
  });
  await product.save({ session });

  productLogger.debug('Product saved:', {
    microtronId: productData.id,
  });

  return product;
} as TStaticMethods['addProduct'];

ProductSchema.statics.updateProduct = async function (
  productId,
  data,
  session,
) {
  productLogger.debug('Process update Product:', {
    productId,
    data,
  });

  productLogger.debug('Load old product version');
  const oldProduct = await this.findById(productId).session(session).exec();
  if (!oldProduct) {
    throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
  }

  const dataForUpdate: Partial<Product & TUpdateProductInDB> = _.omit(data, [
    'quantity',
    'originalPrice',
    'originalPriceCurrency',
    'category',
  ]);

  if ('quantity' in data) {
    const quantity = Math.max(data.quantity, 0);

    dataForUpdate.quantity = quantity;
    dataForUpdate.available = quantity > 0;

    productLogger.debug('Change Product quantity and available', {
      old: _.pick(oldProduct, ['quantity', 'available']),
      new: _.pick(dataForUpdate, ['quantity', 'available']),
    });
  }

  if (
    'originalPrice' in data ||
    'originalPriceCurrency' in data ||
    'category' in data
  ) {
    if (!data.category) {
      throw new HttpException('Category is required', HttpStatus.BAD_REQUEST);
    }

    const category = data.category;
    const originalPrice = data.originalPrice ?? oldProduct.originalPrice;
    const originalPriceCurrency =
      data.originalPriceCurrency ?? oldProduct.originalPriceCurrency;

    const { rawPrice, ourPrice } = this.calculateProductPrice(
      originalPrice,
      originalPriceCurrency,
      category,
    );
    const siteMarkup = this.calculateSiteProductMarkup(
      rawPrice,
      data.sitePrice ?? oldProduct.sitePrice,
    );

    dataForUpdate.originalPrice = originalPrice;
    dataForUpdate.originalPriceCurrency = originalPriceCurrency;
    dataForUpdate.ourPrice = ourPrice;
    dataForUpdate.siteMarkup = siteMarkup;

    productLogger.debug('Change Product price', {
      old: _.pick(oldProduct, [
        'originalPrice',
        'originalPriceCurrency',
        'ourPrice',
        'siteMarkup',
      ]),
      new: _.pick(dataForUpdate, [
        'originalPrice',
        'originalPriceCurrency',
        'ourPrice',
        'siteMarkup',
      ]),
    });
  }

  const updatedProduct = await this.findOneAndUpdate(
    {
      _id: productId,
    },
    {
      $set: dataForUpdate,
    },
    {
      returnOriginal: false,
    },
  )
    .session(session)
    .exec();

  productLogger.debug('Product updated:', {
    id: productId,
  });

  return updatedProduct;
} as TStaticMethods['updateProduct'];

ProductSchema.statics.updateAllProducts = async function (data, session) {
  productLogger.debug('Process update all Products:', {
    data,
  });

  const updateResult = await this.updateMany(
    {},
    {
      $set: data,
    },
  )
    .session(session)
    .exec();

  productLogger.debug('Products update result:', {
    ...updateResult,
  });

  return updateResult;
} as TStaticMethods['updateAllProducts'];

ProductSchema.statics.deleteProduct = async function (productId, session) {
  productLogger.debug('Process delete Product:', {
    productId,
  });

  const removedProduct = await this.findOneAndDelete({
    _id: productId,
  })
    .session(session)
    .exec();

  /** @deprecated logic */
  // if (removedProduct.sync.tableLine) {
  //   const { matchedCount, modifiedCount } = await this.updateMany(
  //     {
  //       'sync.tableLine': {
  //         $gt: removedProduct.sync.tableLine,
  //       },
  //     },
  //     [
  //       {
  //         $set: {
  //           'sync.tableLine': {
  //             $subtract: ['$sync.tableLine', 1],
  //           },
  //         },
  //       },
  //     ],
  //   )
  //     .session(session)
  //     .exec();
  //
  //   productLogger.debug('Updated Products with higher table line:', {
  //     matchedCount,
  //     modifiedCount,
  //   });
  // }

  productLogger.debug('Product removed:', {
    productId,
  });

  return removedProduct;
} as TStaticMethods['deleteProduct'];
