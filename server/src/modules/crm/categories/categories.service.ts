import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Category, CategoryDocument } from '@schemas/category';
import * as _ from 'lodash';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { DataGenerateHelper } from '@common/helpers';
import { Product, ProductDocument } from '@schemas/product';
import { TAddCategoryToDB, TUpdateCategoryInDB } from './types';

@Injectable()
export class CrmCategoriesService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    private dataGenerateHelper: DataGenerateHelper,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  public getModel() {
    return this.categoryModel;
  }

  public async getCategoriesForLoadToSheet() {
    const categories = await this.categoryModel
      .find({ 'sync.loaded': false })
      .exec();
    return {
      categories,
      count: categories.length,
    };
  }

  public async getCategoriesByIds(categoryIds: Types.ObjectId[]) {
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

  public async getCategoriesWithProductsCount(): Promise<
    Array<CategoryDocument & { productsCount: number }>
  > {
    // return this.categoryModel
    //   .aggregate([
    //     {
    //       $lookup: {
    //         from: 'products',
    //         localField: '_id',
    //         foreignField: 'category',
    //         pipeline: [{ $project: { _id: 1 } }],
    //         as: 'products',
    //       },
    //     },
    //     { $set: { productsCount: { $size: '$products' } } },
    //     { $unset: ['products'] },
    //     { $sort: { productsCount: -1 } },
    //   ])
    //   .exec();

    // faster than category version
    return this.productModel
      .aggregate([
        {
          $group: {
            _id: '$category',
            productsCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'categories',
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [{ $arrayElemAt: ['$categories', 0] }, '$$ROOT'],
            },
          },
        },
        { $unset: 'categories' },
        { $sort: { productsCount: -1 } },
      ])
      .exec();
  }

  public async addCategory(categoryData: TAddCategoryToDB) {
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
      sync: {
        localAt: new Date(),
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

    this.logger.debug('Category saved:', {
      microtronId: categoryData.id,
    });

    return category;
  }

  public async updateCategory(
    categoryId: Types.ObjectId,
    data: TUpdateCategoryInDB,
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
        {
          returnOriginal: false,
        },
      )
      .exec();

    this.logger.debug('Category updated:', {
      categoryId,
    });

    return updatedCategory;
  }

  public async updateAllCategories(data: Partial<TUpdateCategoryInDB>) {
    this.logger.debug('Process update all Categories:', {
      data,
    });

    const updateResult = await this.categoryModel
      .updateMany(
        {},
        {
          $set: data,
        },
      )
      .exec();

    this.logger.debug('Categories update result:', {
      ...updateResult,
    });

    return updateResult;
  }

  public async deleteCategory(categoryId: Types.ObjectId) {
    this.logger.debug('Process delete Category:', {
      categoryId,
    });

    const removedCategory = await this.categoryModel
      .findOneAndDelete({
        _id: categoryId,
      })
      .exec();

    if (removedCategory.sync.tableLine) {
      const categoriesWithHigherTableLine = await this.categoryModel
        .find({
          'sync.tableLine': {
            $gt: removedCategory.sync.tableLine,
          },
        })
        .select({
          _id: 1,
          'sync.tableLine': 1,
        })
        .exec();

      this.logger.debug('Process update Categories with higher table line:', {
        categories: categoriesWithHigherTableLine.length,
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
                  'sync.tableLine': category.sync.tableLine - 1,
                },
              },
            )
            .exec();
        }),
      );
    }

    this.logger.debug('Category removed:', {
      categoryId,
    });

    return removedCategory;
  }
}
