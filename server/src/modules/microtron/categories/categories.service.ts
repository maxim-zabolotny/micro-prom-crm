import * as _ from 'lodash';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MicrotronAPI, { Category, Types } from '@lib/microtron';
import { Constant, ConstantModel } from '@schemas/constant';
import { InjectModel } from '@nestjs/mongoose';
import { Data } from '../../../data';
import { DataUtilsHelper } from '@common/helpers';
import {
  ICategoryInConstant,
  ICategoryTreeInConstant,
  ICategoryTreeWithSelectStatus,
  ICategoryWithSelectStatus,
  ITranslatedCategoryInConstant,
} from '@common/interfaces/category';
import { SetMarkupDto } from './dto/set-markup.dto';

type ICategoriesTree = Category.ICategoriesTree;
type ICategory = Category.ICategory;

@Injectable()
export class MicrotronCategoriesService {
  private readonly logger = new Logger(this.constructor.name);

  private readonly categoriesAPI: Category.Category;

  private readonly uaCategoriesCache: ICategory[] = [];
  private readonly ruCategoriesCache: ICategory[] = [];

  constructor(
    private configService: ConfigService,
    private dataUtilHelper: DataUtilsHelper,
    @InjectModel(Constant.name) private constantModel: ConstantModel,
  ) {
    this.categoriesAPI = new MicrotronAPI.Category({
      token: configService.get('microtron.otpToken'),
    });
  }

  public async retrieveFromAPI(
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

  public async retrieveRUFromAPI(categoryIds: Array<ICategory['id']>) {
    this.logger.debug('Load RU categories from API');
    const apiCategories = await this.retrieveFromAPI(true, Types.Lang.RU);
    const apiCategoriesMap = new Map(
      _.map(apiCategories, (category) => [category.id, category]),
    );

    this.logger.debug(
      'Build intercept loaded RU categories from API with saved in DB categories',
    );
    const { intersection } = this.dataUtilHelper.getDiff(categoryIds, [
      ...apiCategoriesMap.keys(),
    ]);

    if (intersection.length !== categoryIds.length) {
      const expectedCategories = _.filter(
        apiCategories,
        (category) => !_.includes(categoryIds, category.id),
      );

      throw new HttpException(
        {
          message: 'Not Found Categories returned from Microtron API',
          categories: expectedCategories,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return _.map(intersection, (categoryId) =>
      apiCategoriesMap.get(categoryId),
    );
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

  /** @deprecated */
  public async setMarkup(
    markupCategoryData: SetMarkupDto,
  ): Promise<ICategoryInConstant> {
    this.logger.debug('Load categories from DB');
    const savedCategories = await this.constantModel.getCategories();
    if (!savedCategories) {
      throw new HttpException(
        'No saved categories in DB',
        HttpStatus.BAD_REQUEST,
      );
    }

    const dbCategories =
      this.constantModel.getParsedCategories(savedCategories);

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

  public async getSaved(
    tree: boolean,
  ): Promise<Array<ICategoryInConstant | ICategoryTreeInConstant>> {
    this.logger.debug('Load categories from DB');

    const categoriesData = await this.constantModel.getCategories();
    if (categoriesData) {
      const data = this.constantModel.getParsedCategories(categoriesData);

      if (tree) {
        this.logger.debug('Build and return categories tree');
        return MicrotronAPI.Category.buildCategoriesTree(
          data,
        ) as unknown as ICategoryTreeInConstant[];
      }

      this.logger.debug('Return categories from DB');
      return data;
    }

    this.logger.debug('No saved categories in DB. Return empty array');
    return [];
  }

  public async getSavedRUTranslate(
    tree: boolean,
  ): Promise<Array<ICategory | ICategoriesTree>> {
    this.logger.debug('Load RU categories from file');
    const ruCategories = await Data.SelectedRUCategories.read();

    if (tree) {
      this.logger.debug('Build and return RU categories tree');
      return MicrotronAPI.Category.buildCategoriesTree(ruCategories);
    }

    return ruCategories;
  }

  public async getSavedWithAll(
    tree: boolean,
  ): Promise<Array<ICategoryWithSelectStatus | ICategoryTreeWithSelectStatus>> {
    const apiCategories = (await this.getByAPI(true, false)) as ICategory[];
    const savedCategories = (await this.getSaved(
      false,
    )) as ICategoryInConstant[];

    const savedCategoriesMap = new Map(
      _.map(savedCategories, (category) => [category.id, category]),
    );

    this.logger.debug('Mapping Saved and All Categories');
    const categoriesWithStatus = _.map(apiCategories, (apiCategory) => {
      const savedCategory = savedCategoriesMap.get(apiCategory.id);
      if (savedCategory) {
        return {
          ...apiCategory,
          ..._.pick(savedCategory, ['markup', 'promName']),
          selected: true,
        };
      }

      return {
        ...apiCategory,
        markup: 0,
        promName: '',
        selected: false,
      };
    });

    if (tree) {
      this.logger.debug('Build and return Mapped categories tree');
      return MicrotronAPI.Category.buildCategoriesTree(
        categoriesWithStatus,
      ) as unknown as ICategoryTreeWithSelectStatus[];
    }

    return categoriesWithStatus;
  }

  public async getFullCategoriesInfo(): Promise<
    ITranslatedCategoryInConstant[]
  > {
    const uaCategories = (await this.getSaved(false)) as ICategoryInConstant[];
    const ruCategories = (await this.getSavedRUTranslate(false)) as ICategory[];

    const ruCategoriesMap = new Map(
      _.map(ruCategories, (ruCategory) => [ruCategory.id, ruCategory]),
    );

    this.logger.debug('Mapping UA and RU Categories');
    const categories: ITranslatedCategoryInConstant[] = _.map(
      uaCategories,
      (category) => {
        const ruCategory = ruCategoriesMap.get(category.id);

        return {
          ...category,
          ruName: ruCategory.name,
        };
      },
    );

    return categories;
  }
}
