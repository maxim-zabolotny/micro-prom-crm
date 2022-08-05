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
    return this.categoryModel.find();
  }

  public async getCountOfNotSyncedCategoriesInDB() {
    return this.categoryModel.count({ sync: false });
  }

  public async getAllNotSyncedCategoriesFromDB() {
    return this.categoryModel.find({ sync: false });
  }

  public async addCategoryToDB(categoryData: TAddCategory) {
    this.logger.debug('Process add Category:', {
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

    const children: CategoryDocument[] = [];
    if (!_.isEmpty(categoryData.children)) {
      this.logger.debug('Process add Category children');

      children.push(
        ..._.flattenDeep(
          await Promise.all(
            _.map(categoryData.children, (categoryChildren) => {
              return this.addCategoryToDB({
                ...categoryChildren,
                ..._.pick(categoryData, ['course', 'integrationId']),
                parent: category,
              });
            }),
          ),
        ),
      );
    }

    return _.flattenDeep([category, children]);
  }

  public async updateCategoryInDB(
    categoryId: Types.ObjectId,
    data: TUpdateCategory,
  ) {
    this.logger.debug('Process update Category:', {
      categoryId,
      data,
    });

    const updatedCategory = await this.categoryModel.findOneAndUpdate(
      {
        _id: categoryId,
      },
      {
        $set: data,
      },
    );

    return updatedCategory;
  }

  public async deleteCategoryFromDB(categoryId: Types.ObjectId) {
    this.logger.debug('Process delete Category:', {
      categoryId,
    });

    const deleteResult = await this.categoryModel.deleteOne({
      _id: categoryId,
    });

    return {
      ...deleteResult,
      categoryId,
    };
  }

  public async deleteCategoriesFromDB(categoryIds: Types.ObjectId[]) {
    this.logger.debug('Process delete Categories:', {
      categoryIds,
    });

    const deleteResult = await this.categoryModel.deleteMany({
      _id: {
        $in: categoryIds,
      },
    });

    return {
      ...deleteResult,
      categoryIds,
    };
  }
}
