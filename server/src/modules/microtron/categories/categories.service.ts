import * as _ from 'lodash';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MicrotronAPI, { Category, Types } from '@lib/microtron';
import {
  Constant,
  ConstantDocument,
  ConstantEntities,
} from '@schemas/constant';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { SaveCategoriesDto } from './dto/save-categories.dto';
import { Data } from '../../../data';
import { DataUtilsHelper } from '@common/helpers';
import {
  ICategoryInConstant,
  ICategoryTreeInConstant,
} from '@common/interfaces/category';
import { SetMarkupDto } from './dto/set-markup.dto';

type ICategoriesTree = Category.ICategoriesTree;
type ICategory = Category.ICategory;

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(this.constructor.name);

  private readonly categoriesAPI: Category.Category;

  private readonly uaCategoriesCache: ICategory[] = [];
  private readonly ruCategoriesCache: ICategory[] = [];

  constructor(
    private configService: ConfigService,
    private dataUtilHelper: DataUtilsHelper,
    @InjectModel(Constant.name) private constantModel: Model<ConstantDocument>,
  ) {
    this.categoriesAPI = new MicrotronAPI.Category({
      token: configService.get('tokens.microtron'),
    });
  }

  private async retrieveFromAPI(
    force: boolean,
    lang: Types.Lang,
  ): Promise<ICategory[]> {
    const cache =
      lang === Types.Lang.UA ? this.uaCategoriesCache : this.ruCategoriesCache;

    let fromCache = true;
    if (force || _.isEmpty(cache)) {
      const categories = await this.categoriesAPI.getCategories(lang);
      cache.push(...categories);

      fromCache = false;
    }

    if (fromCache) {
      this.logger.debug('Take cached categories', { lang });
    }

    return cache;
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
    const categories = await this.retrieveFromAPI(force, Types.Lang.UA);

    if (tree) {
      this.logger.debug('Build and return categories tree');
      return MicrotronAPI.Category.buildCategoriesTree(categories);
    }

    return categories;
  }

  public async getSaved(
    tree: boolean,
  ): Promise<Array<ICategoryInConstant | ICategoryTreeInConstant>> {
    this.logger.debug('Load categories from DB');

    const categoriesData = await this.retrieveFromDB();
    if (categoriesData) {
      const data: ICategoryInConstant[] = JSON.parse(
        categoriesData.toObject().value,
      );

      if (tree) {
        this.logger.debug('Build and return categories tree ');
        return MicrotronAPI.Category.buildCategoriesTree(
          data,
        ) as ICategoryTreeInConstant[];
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
    this.logger.debug('Receive categories in array view');
    const categories = categoriesData.categories;

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

  public async setMarkup(
    markupCategoryData: SetMarkupDto,
  ): Promise<ICategoryInConstant> {
    this.logger.debug('Load categories from DB');
    const savedCategories = await this.retrieveFromDB();
    if (!savedCategories) {
      throw new HttpException(
        'No saved categories in DB',
        HttpStatus.BAD_REQUEST,
      );
    }

    const dbCategories: ICategoryInConstant[] = JSON.parse(
      savedCategories.toObject().value,
    );

    const category = _.find(
      dbCategories,
      (category) => category.id === markupCategoryData.id,
    );
    if (!category) {
      throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
    }

    category.markup = markupCategoryData.markup;

    this.logger.debug('Save categories data to record in DB');
    savedCategories.value = JSON.stringify(dbCategories);
    await savedCategories.save();

    this.logger.debug('Write categories data in file');
    await Data.SelectedCategories.write(dbCategories);

    return category;
  }

  public async getSavedRUTranslate(
    tree: boolean,
  ): Promise<Array<ICategory | ICategoriesTree>> {
    this.logger.debug('Load categories from DB');

    const dbCategoriesData = await this.retrieveFromDB();
    if (!dbCategoriesData) {
      throw new HttpException(
        'No saved categories in DB',
        HttpStatus.BAD_REQUEST,
      );
    }

    const dbCategories: ICategory[] = JSON.parse(
      dbCategoriesData.toObject().value,
    );
    const dbCategoryIds = _.map(dbCategories, 'id');

    this.logger.debug('Load RU categories from API');
    const apiCategories = await this.retrieveFromAPI(false, Types.Lang.RU);

    this.logger.debug(
      'Build intercept loaded RU categories from API with saved in DB categories',
    );
    const apiCategoriesIntercept = _.filter(apiCategories, (category) =>
      dbCategoryIds.includes(category.id),
    );

    if (tree) {
      this.logger.debug('Build and return RU categories tree');
      return MicrotronAPI.Category.buildCategoriesTree(apiCategoriesIntercept);
    }

    return apiCategoriesIntercept;
  }
}
