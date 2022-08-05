import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { DataGenerateHelper } from '@common/helpers';
import { Product, ProductDocument } from '@schemas/product';

@Injectable()
export class CrmProductService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    private dataGenerateHelper: DataGenerateHelper,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}
}
