import * as _ from 'lodash';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { DataGenerateHelper } from '@common/helpers';
import { Product, ProductDocument } from '@schemas/product';
import { IProductFullInfo } from '@common/interfaces/product';
import { CategoryDocument } from '@schemas/category';

export type TAddProduct = IProductFullInfo & {
  category: CategoryDocument;
};

@Injectable()
export class CrmProductsService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    private dataGenerateHelper: DataGenerateHelper,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  public async getAllProductsFromDB() {
    return this.productModel.find().exec();
  }

  public async getCountOfNotSyncedProductsInDB() {
    return this.productModel.count({ sync: false }).exec();
  }

  public async getAllNotSyncedProductsFromDB() {
    return this.productModel.find({ sync: false }).exec();
  }

  public async addProductToDB(productData: TAddProduct) {
    this.logger.debug('Process add Product:', {
      id: productData.id,
      name: productData.name,
      categoryMicrotronId: productData.category.microtronId,
    });

    const { parse, translate, category } = productData;

    const price = _.isNumber(productData.price)
      ? productData.price
      : productData.price_s;
    const quantity = _.isNumber(productData.quantity)
      ? productData.quantity
      : productData.quantity_s;

    const rawPrice = price * category.course;
    const onePercentFromRawPrice = rawPrice / 100;

    const markupAmount = onePercentFromRawPrice * category.markup;
    const ourPrice = rawPrice + markupAmount;

    const siteMarkup = (parse.cost.price - rawPrice) / onePercentFromRawPrice;

    const product = new this.productModel({
      name: productData.name,
      description: parse.description,
      translate: translate,
      brand: productData.brand,
      specifications: parse.specifications,
      sitePrice: parse.cost.price,
      siteMarkup: Number(siteMarkup.toFixed(3)),
      originalPrice: price,
      ourPrice: Number(ourPrice.toFixed(3)),
      quantity: quantity,
      warranty: productData.warranty,
      vendorCode: productData.vendorCode,
      UKTZED: productData.UKTZED,
      url: productData.url,
      images: productData.images,
      new: parse.new,
      available: parse.available,
      category: category._id,
      microtronId: productData.id,
      promId: this.dataGenerateHelper.randomNumber(1, 9, 8),
    });
    await product.save();

    return product;
  }
}
