import * as _ from 'lodash';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Constant, ConstantModel } from '@schemas/constant';
import { SaveCategoriesDto } from './dto/save-categories.dto';
import { Data } from '../../../data';
import { MicrotronCategoriesService } from '../../microtron/categories/categories.service';
import { InjectQueue } from '@nestjs/bull';
import {
  syncCategoriesName,
  TSyncCategoriesProcessorQueue,
} from '../../job/consumers';
import { Product, ProductModel } from '@schemas/product';

@Injectable()
export class CrmCategoriesService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    private microtronCategoriesService: MicrotronCategoriesService,
    @InjectModel(Constant.name) private constantModel: ConstantModel,
    @InjectModel(Product.name) private productModel: ProductModel,
    @InjectQueue(syncCategoriesName)
    private syncCategoriesQueue: TSyncCategoriesProcessorQueue,
  ) {}

  public async getAllWithProductsCount() {
    const categoriesWithProducts =
      await this.productModel.getCategoriesWithProductsCount();
    return categoriesWithProducts;
  }

  public async saveToConstant(
    categoriesData: SaveCategoriesDto,
  ): Promise<{ success: boolean }> {
    this.logger.debug('Received categories in array view');
    const categories = categoriesData.categories;

    // DATA
    this.logger.debug('Write RU categories data to file');
    await Data.SelectedRUCategories.write(
      await this.microtronCategoriesService.retrieveRUFromAPI(
        _.map(categories, 'id'),
      ),
    );

    this.logger.debug('Write categories data to file');
    await Data.SelectedCategories.write(categories);

    // DB
    const categoriesJSON = JSON.stringify(categories);
    await this.constantModel.upsertCategories(categoriesJSON);

    const job = await this.syncCategoriesQueue.add();
    this.logger.debug('Init sync-categories job:', {
      id: job.id,
      name: job.queue.name,
      data: job.data,
    });

    return {
      success: true,
    };
  }
}
