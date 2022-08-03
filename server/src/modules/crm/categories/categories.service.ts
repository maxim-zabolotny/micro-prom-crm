import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Category, CategoryDocument } from '@schemas/category';
import * as _ from 'lodash';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { DataGenerateHelper } from '@common/helpers';
import { ITranslatedCategoryTreeInConstant } from '@common/interfaces/category';

export type TAddCategory = ITranslatedCategoryTreeInConstant & {
  course: number;
  integrationId: Types.ObjectId;
  parent?: CategoryDocument;
};

export type TUpdateCategory = Partial<Pick<TAddCategory, 'course' | 'markup'>>;

@Injectable()
export class CrmCategoriesService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    private dataGenerateHelper: DataGenerateHelper,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  public async addCategoryToDB(categoryData: TAddCategory) {
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
      promId: this.dataGenerateHelper.randomNumber(1, 9, 8),
      parentPromId: categoryData.parent?.promId,
      integration: categoryData.integrationId,
    });
    await category.save();

    const children: Category[] = [];
    if (!_.isEmpty(categoryData.children)) {
      this.logger.debug('Process category children');

      children.push(
        ...(await Promise.all(
          _.map(categoryData.children, (categoryChildren) => {
            return this.addCategoryToDB({
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

  public async updateCategoryInDB(
    categoryId: Types.ObjectId,
    data: TUpdateCategory,
  ) {}

  public async deleteCategoryFromDB(categoryId: Types.ObjectId) {}
}
