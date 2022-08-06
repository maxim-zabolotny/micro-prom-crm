import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Category, CategoryDocument } from '@schemas/category';
import * as _ from 'lodash';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { DataGenerateHelper } from '@common/helpers';
import { ITranslatedCategoryInConstant } from '@common/interfaces/category';

export type TAddCategory = ITranslatedCategoryInConstant & {
  course: number;
  integrationId: Types.ObjectId;
};

export type TUpdateCategory = Partial<
  Pick<Category, 'course' | 'markup' | 'promTableLine' | 'sync' | 'syncAt'>
>;

@Injectable()
export class CrmCategoriesService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    private dataGenerateHelper: DataGenerateHelper,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  public async getAllCategoriesFromDB() {
    return this.categoryModel.find().exec();
  }

  public async getCountOfNotSyncedCategoriesInDB() {
    return this.categoryModel.count({ sync: false }).exec();
  }

  public async getAllNotSyncedCategoriesFromDB() {
    return this.categoryModel.find({ sync: false }).exec();
  }

  public async getCategoriesByIdsFromDB(categoryIds: Types.ObjectId[]) {
    if (_.isEmpty(categoryIds)) return [];

    return this.categoryModel
      .find({
        _id: {
          $in: categoryIds,
        },
      })
      .exec();
  }

  public async getCategoryByMicrotronId(microtronId: string) {
    return this.categoryModel.findOne({ microtronId }).exec();
  }

  public async addCategoryToDB(categoryData: TAddCategory) {
    const parentMicrotronId =
      categoryData.parentId !== '0' ? categoryData.parentId : undefined;

    this.logger.debug('Process add Category:', {
      id: categoryData.id,
      name: categoryData.name,
      parentMicrotronId: parentMicrotronId,
    });

    let parent: CategoryDocument | null = null;
    if (parentMicrotronId) {
      this.logger.debug('Process find parent Category:', {
        microtronId: categoryData.parentId,
      });

      const result = await this.categoryModel
        .findOne({
          microtronId: parentMicrotronId,
        })
        .exec();
      if (result) {
        this.logger.debug('Found parent Category:', {
          id: result._id,
          name: result.name,
          microtronId: result.microtronId,
        });

        parent = result;
      }
    }

    const category = new this.categoryModel({
      name: categoryData.name,
      markup: categoryData.markup,
      course: categoryData.course,
      translate: {
        name: categoryData.ruName,
      },
      parent: parent?._id,
      microtronId: categoryData.id,
      parentMicrotronId: parentMicrotronId,
      promId: this.dataGenerateHelper.randomNumber(1, 9, 8),
      parentPromId: parent?.promId,
      integration: categoryData.integrationId,
    });
    await category.save();

    const { matchedCount, modifiedCount } = await this.categoryModel
      .updateMany(
        {
          parentMicrotronId: category.microtronId,
        },
        {
          $set: {
            parent: category._id,
            parentPromId: category.promId,
          },
        },
      )
      .exec();
    this.logger.debug('Update Category children result:', {
      matchedCount,
      modifiedCount,
    });

    return category;
  }

  public async updateCategoryInDB(
    categoryId: Types.ObjectId,
    data: TUpdateCategory,
  ) {
    this.logger.debug('Process update Category:', {
      categoryId,
      data,
    });

    const updatedCategory = await this.categoryModel
      .findOneAndUpdate(
        {
          _id: categoryId,
        },
        {
          $set: data,
        },
      )
      .exec();

    return updatedCategory;
  }

  public async deleteCategoryFromDB(categoryId: Types.ObjectId) {
    this.logger.debug('Process delete Category:', {
      categoryId,
    });

    const removedCategory = await this.categoryModel
      .findOneAndDelete({
        _id: categoryId,
      })
      .exec();

    if (removedCategory.promTableLine) {
      const categoriesWithHigherTableLine = await this.categoryModel
        .find({
          promTableLine: {
            $gt: removedCategory.promTableLine,
          },
        })
        .select({
          _id: 1,
          promTableLine: 1,
        })
        .exec();

      this.logger.debug('Process update Categories with higher table line:', {
        categories: categoriesWithHigherTableLine,
      });

      await Promise.all(
        _.map(categoriesWithHigherTableLine, async (category) => {
          await this.categoryModel
            .updateOne(
              {
                _id: category._id,
              },
              {
                $set: {
                  promTableLine: category.promTableLine - 1,
                },
              },
            )
            .exec();
        }),
      );
    }

    return removedCategory;
  }
}
