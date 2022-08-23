import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from '@schemas/product';
import { ProductModel } from '@schemas/product/product.schema';

@Injectable()
export class CrmProductsService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    @InjectModel(Product.name) private productModel: ProductModel,
  ) {}

  public async getAllProducts() {
    return this.productModel.getAllProducts();
  }
}
