import * as _ from 'lodash';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Constant, ConstantDocument } from '@schemas/constant';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  DataGenerateHelper,
  DataUtilsHelper,
  TimeHelper,
} from '@common/helpers';
import { Category, CategoryDocument } from '@schemas/category';
import { CoursesService } from '../../microtron/courses/courses.service';
import { CategoriesService } from '../../microtron/categories/categories.service';
import { ICategoryInConstant } from '@common/interfaces/category';
import MicrotronAPI from '@lib/microtron';
import {
  Integration,
  IntegrationCompany,
  IntegrationDocument,
} from '@schemas/integration';

export interface ITranslatedCategoryInConstant extends ICategoryInConstant {
  ruName: string;
}

export interface ITranslatedCategoryTreeInConstant
  extends Omit<ITranslatedCategoryInConstant, 'parentId'> {
  children: ITranslatedCategoryTreeInConstant[];
}

export type TAddCategory = ITranslatedCategoryTreeInConstant & {
  course: number;
  integrationId: Types.ObjectId;
  parent?: CategoryDocument;
};

export type TUpdateCategory = Partial<Pick<TAddCategory, 'course' | 'markup'>>;

@Injectable()
export class SyncLocalService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    private coursesService: CoursesService,
    private categoriesService: CategoriesService,
    private dataUtilHelper: DataUtilsHelper,
    private dataGenerateHelper: DataGenerateHelper,
    private timeHelper: TimeHelper,
    @InjectModel(Constant.name) private constantModel: Model<ConstantDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Integration.name)
    private integrationModel: Model<IntegrationDocument>,
  ) {}

  // TODO: Move to categories CRM
  public async addCategory(categoryData: TAddCategory) {
    this.logger.debug('Process category:', {
      id: categoryData.id,
      name: categoryData.name,
    });

    const category = new this.categoryModel({
      name: categoryData.name,
      markup: categoryData.markup,
      course: categoryData.course,
      translate: {
        name: categoryData.ruName,
      },
      parent: categoryData.parent?._id,
      microtronId: categoryData.id,
      parentMicrotronId: categoryData.parent?.microtronId,
      promId: this.dataGenerateHelper.randomNumber(0, 9, 8),
      parentPromId: categoryData.parent?.promId,
      integration: categoryData.integrationId,
    });
    await category.save();

    const children = [];
    if (!_.isEmpty(categoryData.children)) {
      this.logger.debug('Process category children');

      children.push(
        ...(await Promise.all(
          _.map(categoryData.children, (categoryChildren) => {
            return this.addCategory({
              ...categoryChildren,
              ..._.pick(categoryData, ['course', 'integrationId']),
              parent: category,
            });
          }),
        )),
      );
    }

    return {
      ...(category.toJSON() as Category),
      children,
    };
  }

  public async updateCategory(
    categoryId: Types.ObjectId,
    data: TUpdateCategory,
  ) {}

  public async deleteCategory(categoryId: Types.ObjectId) {}

  public async loadAllCategories() {
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

    const course = await this.coursesService.getCoursesByAPI(false);

    const uaCategories = (await this.categoriesService.getSaved(
      false,
    )) as ICategoryInConstant[];
    const ruCategories = (await this.categoriesService.getSavedRUTranslate(
      false,
    )) as ICategoryInConstant[];

    this.logger.debug('Mapping UA and RU categories');
    const categories: ITranslatedCategoryInConstant[] = _.map(
      uaCategories,
      (category) => {
        const ruCategory = _.find(
          ruCategories,
          (ruCategory) => ruCategory.id === category.id,
        );

        return {
          ...category,
          parentId: String(category.parentId),
          ruName: ruCategory.name,
        };
      },
    );

    this.logger.debug('Build categories tree');
    const categoriesTree = MicrotronAPI.Utils.makeTree(
      categories,
      'parentId',
      '0',
    ) as unknown as ITranslatedCategoryTreeInConstant[];

    this.logger.debug('Start loading categories to DB');
    return await Promise.all(
      _.map(categoriesTree, (categoryData) => {
        return this.addCategory({
          ...categoryData,
          course: course.bank,
          integrationId: microtronIntegration._id,
        });
      }),
    );
  }
}
