import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from '@schemas/product';
import { ProductModel } from '@schemas/product/product.schema';
import { SearchProductsDto } from './dto/search-products.dto';
import { Types } from 'mongoose';

@Injectable()
export class CrmProductsService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    @InjectModel(Product.name) private productModel: ProductModel,
  ) {}

  public async getById(id: Types.ObjectId) {
    this.logger.debug('Get Product by id:', { id });

    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    return product;
  }

  public async getAllProducts() {
    this.logger.debug('Get All Products');

    return this.productModel.getAllProducts();
  }

  public async search({ limit, offset, ...data }: SearchProductsDto) {
    this.logger.debug('Find Products:', {
      limit,
      offset,
      data,
    });

    const products = await this.productModel.findProducts(data, {
      limit,
      offset,
    });

    this.logger.debug('Found Products:', {
      count: products.length,
    });

    return products;
  }
}
