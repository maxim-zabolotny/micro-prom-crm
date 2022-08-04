import * as _ from 'lodash';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { MicrotronCoursesService } from '../../microtron/courses/courses.service';
import { MicrotronCategoriesService } from '../../microtron/categories/categories.service';
import {
  ICategoryInConstant,
  ITranslatedCategoryInConstant,
  ITranslatedCategoryTreeInConstant,
} from '@common/interfaces/category';
import MicrotronAPI from '@lib/microtron';
import {
  Integration,
  IntegrationCompany,
  IntegrationDocument,
} from '@schemas/integration';
import {
  CrmCategoriesService,
  TAddCategory,
} from '../../crm/categories/categories.service';
import { CategoryDocument } from '@schemas/category';
import { DataUtilsHelper } from '@common/helpers';
import { TArray } from '@custom-types';

export type TCompareCategoriesKeys = Extract<
  keyof ITranslatedCategoryInConstant,
  'markup'
>;

export interface IChangeCategoriesActions {
  categoriesToAdd: ITranslatedCategoryInConstant[];
  categoriesToUpdate: Array<
    TArray.Pair<
      CategoryDocument,
      Pick<ITranslatedCategoryInConstant, TCompareCategoriesKeys>
    >
  >;
  categoriesToRemove: CategoryDocument[];
}

export interface IChangedCategoriesResult {
  added: CategoryDocument[];
  updated: CategoryDocument[];
  removed: Types.ObjectId[];
}

@Injectable()
export class SyncLocalService {
  private readonly logger = new Logger(this.constructor.name);

  private readonly compareCategoriesKeys: Array<TCompareCategoriesKeys> = [
    'markup',
  ];

  constructor(
    private configService: ConfigService,
    private microtronCoursesService: MicrotronCoursesService,
    private microtronCategoriesService: MicrotronCategoriesService,
    private crmCategoriesService: CrmCategoriesService,
    private dataUtilsHelper: DataUtilsHelper,
    @InjectModel(Integration.name)
    private integrationModel: Model<IntegrationDocument>,
  ) {}

  public async getMicrotronIntegration() {
    this.logger.debug('Load Microtron Integration from DB');

    const microtronIntegration = await this.integrationModel
      .findOne({ company: IntegrationCompany.Microtron })
      .exec();
    if (!microtronIntegration) {
      throw new HttpException(
        'No saved microtron integration in DB',
        HttpStatus.BAD_REQUEST,
      );
    }

    return microtronIntegration;
  }

  public async getAllTranslatedCategoriesFromConstant() {
    const uaCategories = (await this.microtronCategoriesService.getSaved(
      false,
    )) as ICategoryInConstant[];

    const ruCategories =
      (await this.microtronCategoriesService.getSavedRUTranslate(
        false,
      )) as ICategoryInConstant[];
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
          parentId: String(category.parentId),
          ruName: ruCategory.name,
        };
      },
    );

    return categories;
  }

  public async addCategoriesToDB(
    data: Pick<TAddCategory, 'course' | 'integrationId'>,
    categories: ITranslatedCategoryInConstant[],
  ) {
    const { course, integrationId } = data;

    this.logger.debug('Build Categories tree view');
    const categoriesTree = MicrotronAPI.Utils.makeTree(
      categories,
      'parentId',
      '0',
    ) as unknown as ITranslatedCategoryTreeInConstant[];

    this.logger.debug('Start loading Categories to DB', {
      count: categories.length,
    });

    const addedCategories = await Promise.all(
      _.map(categoriesTree, (categoryData) => {
        return this.crmCategoriesService.addCategoryToDB({
          ...categoryData,
          course,
          integrationId,
        });
      }),
    );
    this.logger.debug('Loaded Categories to DB:', {
      count: addedCategories.length,
    });

    return _.flattenDeep(addedCategories);
  }

  public async updateCategoriesInDB(
    categoriesWithData: IChangeCategoriesActions['categoriesToUpdate'],
  ) {
    this.logger.debug('Update Categories in DB:', {
      ids: _.map(categoriesWithData, (categoryData) => categoryData[0]._id),
      count: categoriesWithData.length,
    });

    const updatedCategories = await Promise.all(
      _.map(categoriesWithData, ([category, data]) => {
        return this.crmCategoriesService.updateCategoryInDB(category._id, data);
      }),
    );
    this.logger.debug('Updated Categories in DB:', {
      ids: _.map(updatedCategories, '_id'),
      count: updatedCategories.length,
    });

    return updatedCategories;
  }

  public async deleteCategoriesFromDB(
    categories: Array<Pick<CategoryDocument, '_id'>>,
  ) {
    this.logger.debug('Start removing Categories from DB', {
      ids: _.map(categories, '_id'),
      count: categories.length,
    });

    const { categoryIds, deletedCount } =
      await this.crmCategoriesService.deleteCategoriesFromDB(
        _.map(categories, '_id'),
      );
    this.logger.debug('Removed Categories from DB:', {
      ids: categoryIds,
      count: deletedCount,
    });

    return categoryIds;
  }

  public async getChangeCategoriesActions(
    add = true,
    update = true,
    remove = true,
  ) {
    const result: IChangeCategoriesActions = {
      categoriesToAdd: [],
      categoriesToUpdate: [],
      categoriesToRemove: [],
    };

    const categoriesFromConstant =
      await this.getAllTranslatedCategoriesFromConstant();
    const categoriesFromConstantMap = new Map(
      _.map(categoriesFromConstant, (category) => [category.id, category]),
    );

    const categoriesFromDB =
      await this.crmCategoriesService.getAllCategoriesFromDB();
    const categoriesFromDBMap = new Map(
      _.map(categoriesFromDB, (category) => [category.microtronId, category]),
    );

    const {
      added: addedCategoryIds,
      intersection: categoryIds,
      removed: removedCategoryIds,
    } = this.dataUtilsHelper.getDiff(
      _.map(categoriesFromConstant, 'id'),
      _.map(categoriesFromDB, 'microtronId'),
    );

    if (add) {
      if (!_.isEmpty(addedCategoryIds)) {
        result.categoriesToAdd = _.map(addedCategoryIds, (categoryId) =>
          categoriesFromConstantMap.get(categoryId),
        );

        this.logger.debug('Found Categories to add to DB:', {
          count: result.categoriesToAdd.length,
        });
      } else {
        this.logger.debug('Not found added Categories between DB and Constant');
      }
    }

    if (update) {
      if (!_.isEmpty(categoryIds)) {
        this.logger.debug(
          'Found intercepted Categories between DB and Constant:',
          {
            count: categoryIds.length,
          },
        );

        result.categoriesToUpdate = _.compact(
          _.map(categoryIds, (categoryId) => {
            const categoryFromConstant =
              categoriesFromConstantMap.get(categoryId);
            const categoryFromDB = categoriesFromDBMap.get(categoryId);

            const isEqual = _.isEqual(
              _.pick(categoryFromConstant, this.compareCategoriesKeys),
              _.pick(categoryFromDB, this.compareCategoriesKeys),
            );
            if (isEqual) return null;

            return [
              categoryFromDB,
              _.pick(categoryFromConstant, this.compareCategoriesKeys),
            ];
          }),
        );

        this.logger.debug('Found Categories to update in DB:', {
          count: result.categoriesToUpdate.length,
        });
      } else {
        this.logger.debug(
          'Not found updated Categories between DB and Constant',
        );
      }
    }

    if (remove) {
      if (!_.isEmpty(removedCategoryIds)) {
        result.categoriesToRemove = _.map(removedCategoryIds, (categoryId) =>
          categoriesFromDBMap.get(categoryId),
        );

        this.logger.debug('Found Categories to remove from DB:', {
          count: result.categoriesToRemove.length,
        });
      } else {
        this.logger.debug(
          'Not found deleted Categories between DB and Constant',
        );
      }
    }

    return result;
  }

  public async loadAllCategoriesToDB() {
    const microtronIntegration = await this.getMicrotronIntegration();
    const course = await this.microtronCoursesService.getCoursesByAPI(false);

    const categories = await this.getAllTranslatedCategoriesFromConstant();

    return this.addCategoriesToDB(
      {
        course: course.bank,
        integrationId: microtronIntegration._id,
      },
      categories,
    );
  }

  public async syncAllCategoriesWithConstant(
    add = true,
    update = true,
    remove = true,
  ) {
    if (!add && !update && !remove) {
      throw new HttpException('Nothing for to do', HttpStatus.BAD_REQUEST);
    }

    this.logger.debug(
      'Sync Local Categories in DB with Categories in Constant actions:',
      {
        add,
        update,
        remove,
      },
    );

    const result: IChangedCategoriesResult = {
      added: [],
      updated: [],
      removed: [],
    };

    const { categoriesToAdd, categoriesToUpdate, categoriesToRemove } =
      await this.getChangeCategoriesActions(add, update, remove);

    if (!_.isEmpty(categoriesToAdd)) {
      this.logger.debug('Load Microtron Integration from DB');

      const microtronIntegration = await this.getMicrotronIntegration();
      const course = await this.microtronCoursesService.getCoursesByAPI(false);

      result.added = await this.addCategoriesToDB(
        {
          course: course.bank,
          integrationId: microtronIntegration._id,
        },
        categoriesToAdd,
      );
    }

    if (!_.isEmpty(categoriesToUpdate)) {
      result.updated = await this.updateCategoriesInDB(categoriesToUpdate);
    }

    if (!_.isEmpty(categoriesToRemove)) {
      result.removed = await this.deleteCategoriesFromDB(categoriesToRemove);
    }

    return result;
  }
}
