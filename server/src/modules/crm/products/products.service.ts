import * as _ from 'lodash';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { DataGenerateHelper } from '@common/helpers';
import { Product, ProductDocument } from '@schemas/product';
import { IProductFullInfo } from '@common/interfaces/product';
import { Category, CategoryDocument } from '@schemas/category';
import { AppConstants } from '../../../app.constants';
import { Types as MicrotronTypes } from '@lib/microtron';
import { TAddProductToDB } from './types/add-product-to-db.type';
import { TUpdateProductInDB } from './types/update-product-in-db.type';
import ProductConstants = AppConstants.Prom.Sheet.Product;

@Injectable()
export class CrmProductsService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    private dataGenerateHelper: DataGenerateHelper,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  // UTILITIES
  public getProductPrice(product: Pick<IProductFullInfo, 'price' | 'price_s'>) {
    return _.isNumber(product.price) ? product.price : product.price_s;
  }

  public getProductQuantity(
    product: Pick<IProductFullInfo, 'quantity' | 'quantity_s'>,
  ) {
    return _.isNumber(product.quantity) ? product.quantity : product.quantity_s;
  }

  public calculateProductPrice(
    originalPrice: number,
    currency: MicrotronTypes.Currency,
    category: Pick<Category, 'course' | 'markup'>,
  ) {
    const course =
      currency === MicrotronTypes.Currency.UAH ? 1 : category.course;

    const rawPrice = originalPrice * course;
    const onePercentFromRawPrice = rawPrice / 100;

    const markupAmount = onePercentFromRawPrice * category.markup;
    const ourPrice = rawPrice + markupAmount;

    return {
      rawPrice: Number(rawPrice.toFixed(3)),
      ourPrice: Math.ceil(Number(ourPrice.toFixed(3))),
    };
  }

  public calculateSiteProductMarkup(rawPrice: number, sitePrice: number) {
    const onePercentFromRawPrice = rawPrice / 100;
    const siteMarkup = (sitePrice - rawPrice) / onePercentFromRawPrice;

    return Number(siteMarkup.toFixed(3));
  }

  // MAIN
  public getModel() {
    return this.productModel;
  }

  public async getAllProducts() {
    return this.productModel.find().exec();
  }

  public async getProductsByCategories(categoryIds: Types.ObjectId[]) {
    return this.productModel.find({ category: { $in: categoryIds } }).exec();
  }

  public async getProductsForLoadToSheet() {
    const products: Array<
      Omit<ProductDocument, 'category'> & {
        category: Pick<CategoryDocument, '_id' | 'promId'>;
      }
    > = await this.productModel
      .aggregate([
        {
          $match: { 'sync.loaded': false },
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            pipeline: [
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
      .exec();

    return {
      products,
      count: products.length,
    };
  }

  public async getProductsForLoadToSheetByCategory(categoryId: Types.ObjectId) {
    const products = await this.productModel
      .find({ category: categoryId, 'sync.loaded': false })
      .exec();

    return {
      products,
      count: products.length,
    };
  }

  public async getProductsForSyncWithProm(options?: {
    categories?: Types.ObjectId[];
    products?: Types.ObjectId[];
  }) {
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

    return this.productModel.find(searchOptions).exec();
  }

  public async addProduct(productData: TAddProductToDB) {
    this.logger.debug('Process add Product:', {
      id: productData.id,
      name: productData.name,
      categoryMicrotronId: productData.category.microtronId,
    });

    const { parse, translate, category } = productData;

    const price = this.getProductPrice(productData);
    const quantity = this.getProductQuantity(productData);

    const available = quantity > 0;

    const { rawPrice, ourPrice } = this.calculateProductPrice(
      price,
      productData.currency,
      category,
    );
    const siteMarkup = this.calculateSiteProductMarkup(
      rawPrice,
      parse.cost.price,
    );

    // SPEC PART
    const specifications = _.reduce(
      parse.specifications,
      (acc, value, key) => {
        acc[String(key)] = String(value);
        return acc;
      },
      {},
    );

    if (
      productData.warranty > 0 &&
      !specifications[ProductConstants.SpecialSpecificationKeys.GuaranteeTerm]
    ) {
      specifications[
        ProductConstants.SpecialSpecificationKeys.GuaranteeTerm
      ] = `${productData.warranty}`;
    }

    if (!specifications[ProductConstants.SpecialSpecificationKeys.State]) {
      specifications[ProductConstants.SpecialSpecificationKeys.State] =
        parse.new ? 'Новое' : 'Б/У';
    }
    // END SPEC PART

    const product = new this.productModel({
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
      promId: this.dataGenerateHelper.randomNumber(1, 9, 19),
      sync: {
        localAt: new Date(),
      },
    });
    await product.save();

    this.logger.debug('Product saved:', {
      microtronId: productData.id,
    });

    return product;
  }

  public async updateProduct(
    productId: Types.ObjectId,
    data: TUpdateProductInDB,
  ) {
    this.logger.debug('Process update Product:', {
      productId,
      data,
    });

    this.logger.debug('Load old product version');
    const oldProduct = await this.productModel.findById(productId).exec();
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

      this.logger.debug('Change Product quantity and available', {
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
        oldProduct.sitePrice,
      );

      dataForUpdate.originalPrice = originalPrice;
      dataForUpdate.originalPriceCurrency = originalPriceCurrency;
      dataForUpdate.ourPrice = ourPrice;
      dataForUpdate.siteMarkup = siteMarkup;

      this.logger.debug('Change Product price', {
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

    const updatedProduct = await this.productModel
      .findOneAndUpdate(
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
      .exec();

    this.logger.debug('Product updated:', {
      id: productId,
    });

    return updatedProduct;
  }

  public async updateAllProducts(data: Partial<TUpdateProductInDB>) {
    this.logger.debug('Process update all Products:', {
      data,
    });

    const updateResult = await this.productModel
      .updateMany(
        {},
        {
          $set: data,
        },
      )
      .exec();

    this.logger.debug('Products update result:', {
      ...updateResult,
    });

    return updateResult;
  }

  public async deleteProduct(productId: Types.ObjectId) {
    this.logger.debug('Process delete Product:', {
      productId,
    });

    const removedProduct = await this.productModel
      .findOneAndDelete({
        _id: productId,
      })
      .exec();

    if (removedProduct.sync.tableLine) {
      const { matchedCount, modifiedCount } = await this.productModel
        .updateMany(
          {
            'sync.tableLine': {
              $gt: removedProduct.sync.tableLine,
            },
          },
          [
            {
              $set: {
                'sync.tableLine': {
                  $subtract: ['$sync.tableLine', 1],
                },
              },
            },
          ],
        )
        .exec();

      this.logger.debug('Updated Products with higher table line:', {
        matchedCount,
        modifiedCount,
      });
    }

    this.logger.debug('Product removed:', {
      productId,
    });

    return removedProduct;
  }
}
