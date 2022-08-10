import * as _ from 'lodash';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { DataGenerateHelper } from '@common/helpers';
import { Product, ProductDocument } from '@schemas/product';
import { IProductFullInfo } from '@common/interfaces/product';
import { Category, CategoryDocument } from '@schemas/category';

export type TAddProduct = IProductFullInfo & {
  category: CategoryDocument;
};

export type TUpdateProduct = Partial<
  Pick<
    Product,
    'originalPrice' | 'quantity' | 'promTableLine' | 'sync' | 'syncAt'
  > & {
    category: Pick<Category, 'course' | 'markup'>;
  }
>;

@Injectable()
export class CrmProductsService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    private dataGenerateHelper: DataGenerateHelper,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

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
    category: Pick<Category, 'course' | 'markup'>,
  ) {
    const rawPrice = originalPrice * category.course;
    const onePercentFromRawPrice = rawPrice / 100;

    const markupAmount = onePercentFromRawPrice * category.markup;
    const ourPrice = rawPrice + markupAmount;

    return {
      rawPrice: Number(rawPrice.toFixed(3)),
      ourPrice: Number(ourPrice.toFixed(3)),
    };
  }

  public calculateSiteProductMarkup(rawPrice: number, sitePrice: number) {
    const onePercentFromRawPrice = rawPrice / 100;
    const siteMarkup = (sitePrice - rawPrice) / onePercentFromRawPrice;

    return Number(siteMarkup.toFixed(3));
  }

  public async getAllProductsFromDB() {
    return this.productModel.find().exec();
  }

  public async getCountOfNotSyncedProductsInDB() {
    return this.productModel.count({ sync: false }).exec();
  }

  public async getAllNotSyncedProductsFromDB() {
    return this.productModel.find({ sync: false }).exec();
  }

  public async getCountOfNewProductsInDB() {
    return this.productModel.count({ syncAt: undefined }).exec();
  }

  public async getAllNewProductsFromDB() {
    return this.productModel.find({ syncAt: undefined }).exec();
  }

  public async getProductsByCategoryFromDB(categoryId: Types.ObjectId) {
    return this.productModel.find({ category: categoryId }).exec();
  }

  public async getCountOfNewProductsByCategoryInDB(categoryId: Types.ObjectId) {
    return this.productModel
      .count({ category: categoryId, syncAt: undefined })
      .exec();
  }

  public async getNewProductsByCategoryFromDB(categoryId: Types.ObjectId) {
    return this.productModel
      .find({ category: categoryId, syncAt: undefined })
      .exec();
  }

  public async addProductToDB(productData: TAddProduct) {
    this.logger.debug('Process add Product:', {
      id: productData.id,
      name: productData.name,
      categoryMicrotronId: productData.category.microtronId,
    });

    const { parse, translate, category } = productData;

    const price = this.getProductPrice(productData);
    const quantity = this.getProductQuantity(productData);

    const available = quantity > 0 ? parse.available : false;

    const { rawPrice, ourPrice } = this.calculateProductPrice(price, category);
    const siteMarkup = this.calculateSiteProductMarkup(
      rawPrice,
      parse.cost.price,
    );

    // SPEC PART
    if (
      productData.warranty > 0 &&
      !parse.specifications['Гарантійний термін']
    ) {
      parse.specifications[
        'Гарантійний термін'
      ] = `${productData.warranty} міс`;
    }

    if (!parse.specifications['Стан']) {
      parse.specifications['Стан'] = parse.new ? 'Нове' : 'Б/У';
    }
    // END SPEC PART

    const product = new this.productModel({
      name: productData.name,
      description: parse.description,
      translate: translate,
      brand: productData.brand,
      specifications: parse.specifications,
      sitePrice: parse.cost.price,
      siteMarkup: siteMarkup,
      originalPrice: price,
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
      promId: this.dataGenerateHelper.randomNumber(1, 9, 8),
    });
    await product.save();

    this.logger.debug('Product saved');

    return product;
  }

  public async updateProductInDB(
    productId: Types.ObjectId,
    data: TUpdateProduct,
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

    const dataForUpdate: Partial<Product> = _.pick(data, [
      'promTableLine',
      'sync',
      'syncAt',
    ]);

    if (data.quantity) {
      const quantity = Math.min(data.quantity, 0);

      dataForUpdate.quantity = quantity;
      dataForUpdate.available = quantity > 0;

      this.logger.debug('Change Product quantity and available', {
        old: _.pick(oldProduct, ['quantity', 'available']),
        new: _.pick(dataForUpdate, ['quantity', 'available']),
      });
    }

    if (data.originalPrice || data.category) {
      if (!data.category) {
        throw new HttpException('Category is required', HttpStatus.BAD_REQUEST);
      }

      const category = data.category;
      const originalPrice = data.originalPrice ?? oldProduct.originalPrice;

      const { rawPrice, ourPrice } = this.calculateProductPrice(
        originalPrice,
        category,
      );
      const siteMarkup = this.calculateSiteProductMarkup(
        rawPrice,
        oldProduct.sitePrice,
      );

      dataForUpdate.originalPrice = originalPrice;
      dataForUpdate.ourPrice = ourPrice;
      dataForUpdate.siteMarkup = siteMarkup;

      this.logger.debug('Change Product price', {
        old: _.pick(oldProduct, ['originalPrice', 'ourPrice', 'siteMarkup']),
        new: _.pick(dataForUpdate, ['originalPrice', 'ourPrice', 'siteMarkup']),
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
      )
      .exec();

    this.logger.debug('Product updated');

    return updatedProduct;
  }
}
