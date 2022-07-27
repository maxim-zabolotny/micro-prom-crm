import * as _ from 'lodash';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MicrotronAPI, { Category } from '@lib/microtron';
import {
  Constant,
  ConstantDocument,
  ConstantEntities,
} from '@schemas/constant';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { SaveCategoriesDto } from './dto/save-categories.dto';
import { Data } from '../../../data';

type ICategoriesTree = Category.ICategoriesTree;
type ICategory = Category.ICategory;

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(this.constructor.name);

  private readonly categoriesCache: ICategory[] = [];
  private readonly categoriesAPI: Category.Category;

  constructor(
    private configService: ConfigService,
    @InjectModel(Constant.name) private constantModel: Model<ConstantDocument>,
  ) {
    this.categoriesAPI = new MicrotronAPI.Category({
      token: configService.get('tokens.microtron'),
    });
  }

  private async retrieveFromAPI(force: boolean) {
    if (force || _.isEmpty(this.categoriesCache)) {
      const categories = await this.categoriesAPI.getCategories();
      this.categoriesCache.push(...categories);
    }

    return this.categoriesCache;
  }

  private async retrieveFromDB(): Promise<ConstantDocument | null> {
    const categories = await this.constantModel
      .findOne({ name: ConstantEntities.CATEGORIES })
      .exec();

    if (!_.isNull(categories)) {
      return categories;
    }

    return null;
  }

  public async getByAPI(
    force: boolean,
    tree: boolean,
  ): Promise<Array<ICategory | ICategoriesTree>> {
    this.logger.debug('Load categories from API', { force });
    const categories = await this.retrieveFromAPI(force);

    if (tree) {
      this.logger.debug('Build and return categories tree ');
      return MicrotronAPI.Category.buildCategoriesTree(categories);
    }

    return categories;
  }

  public async getSaved(
    tree: boolean,
  ): Promise<Array<ICategory | ICategoriesTree>> {
    this.logger.debug('Load categories from DB');
    const categoriesData = await this.retrieveFromDB();
    if (categoriesData) {
      const data = JSON.parse(categoriesData.toObject().value);

      if (tree) {
        this.logger.debug('Build and return categories tree ');
        return MicrotronAPI.Category.buildCategoriesTree(data);
      }

      this.logger.debug('Return categories from DB');
      return data;
    }

    this.logger.debug('No saved categories in DB. Return empty array');
    return [];
  }

  public async save(
    categoriesData: SaveCategoriesDto,
  ): Promise<{ success: boolean }> {
    let categories!: ICategory[];
    if (categoriesData.isTree) {
      this.logger.debug('Receive categories in tree view. Convert to array');
      categories = MicrotronAPI.Utils.fromTree(
        categoriesData.categories as ICategoriesTree[],
        'id',
        'parentId',
      ) as unknown as ICategory[];
    } else {
      this.logger.debug('Receive categories in array view');
      categories = categoriesData.categories as unknown as ICategory[];
    }

    this.logger.debug('Write categories data in file');
    await Data.SelectedCategories.write(categories);

    const categoriesJSON = JSON.stringify(categories);

    const savedCategories = await this.retrieveFromDB();
    if (savedCategories) {
      this.logger.debug('Save categories data to exist record in DB');

      savedCategories.value = categoriesJSON;
      await savedCategories.save();

      return {
        success: true,
      };
    }

    this.logger.debug('Create record in DB with categories data');
    const categoriesConstant = new this.constantModel({
      name: ConstantEntities.CATEGORIES,
      value: categoriesJSON,
    });
    await categoriesConstant.save();

    return {
      success: true,
    };
  }
}
