import * as _ from 'lodash';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
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
import { CrmCategoriesService } from '../../crm/categories/categories.service';

@Injectable()
export class SyncLocalService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    private microtronCoursesService: MicrotronCoursesService,
    private microtronCategoriesService: MicrotronCategoriesService,
    private crmCategoriesService: CrmCategoriesService,
    @InjectModel(Integration.name)
    private integrationModel: Model<IntegrationDocument>,
  ) {}

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

    const course = await this.microtronCoursesService.getCoursesByAPI(false);

    const uaCategories = (await this.microtronCategoriesService.getSaved(
      false,
    )) as ICategoryInConstant[];
    const ruCategories =
      (await this.microtronCategoriesService.getSavedRUTranslate(
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

    const addedCategories = await Promise.all(
      _.map(categoriesTree, (categoryData) => {
        return this.crmCategoriesService.addCategoryToDB({
          ...categoryData,
          course: course.bank,
          integrationId: microtronIntegration._id,
        });
      }),
    );
    this.logger.debug('Loaded categories to DB:', {
      count: addedCategories.length,
    });

    return addedCategories;
  }
}
