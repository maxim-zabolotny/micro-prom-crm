import * as _ from 'lodash';
import { ClientSession } from 'mongodb';
import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Document,
  Model,
  Schema as MongooseSchema,
  SchemaTypes,
  Types,
  UpdateWriteOpResult,
} from 'mongoose';
import { Integration } from '@schemas/integration';
import {
  CategorySync,
  CategorySyncSchema,
} from '@schemas/category/category-sync.schema';
import { Logger, Type } from '@nestjs/common';
import { ITranslatedCategoryInConstant } from '@common/interfaces/category';
import { DataGenerateHelper } from '@common/helpers';

// TYPES
export type TCategoryTranslate = Pick<Category, 'name'>;

export type TAddCategoryToDB = ITranslatedCategoryInConstant & {
  course: number;
  integrationId: Types.ObjectId;
};

export type TUpdateCategoryInDB = Partial<
  Pick<Category, 'course' | 'markup'> & {
    'sync.localAt': CategorySync['localAt'];
    'sync.loaded': CategorySync['loaded'];
    'sync.lastLoadedAt': CategorySync['lastLoadedAt'];
    'sync.tableLine': CategorySync['tableLine'];
  }
>;

// MONGOOSE
export type CategoryDocument = Category & Document;

export type CategoryModel = Model<CategoryDocument> & TStaticMethods;

@Schema({
  timestamps: true,
  collection: 'categories',
})
export class Category {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Number, required: true })
  markup: number;

  @Prop({ type: Number, required: true })
  course: number;

  @Prop({
    type: raw({
      _id: false,
      name: { type: String, required: true },
    }),
    required: true,
  })
  translate: TCategoryTranslate;

  @Prop({ type: CategorySyncSchema, required: true })
  sync: CategorySync;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'categories' })
  parent?: Category;

  @Prop({ type: String, required: true, unique: true })
  microtronId: string;

  @Prop({ type: String })
  parentMicrotronId?: string;

  @Prop({ type: Number, required: true, unique: true })
  promId: number;

  @Prop({ type: Number })
  parentPromId?: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'integration', required: true })
  integration: Integration;
}

export const CategorySchema = SchemaFactory.createForClass(
  Category,
) as unknown as MongooseSchema<Type<Category>, CategoryModel>;

// CUSTOM TYPES
type TStaticMethods = {
  getAllCategories: (
    this: CategoryModel,
    session?: ClientSession | null,
  ) => Promise<CategoryDocument[]>;
  getCategoriesForLoadToSheet: (
    this: CategoryModel,
    session?: ClientSession | null,
  ) => Promise<{
    categories: CategoryDocument[];
    count: number;
  }>;
  getCategoriesByIds: (
    this: CategoryModel,
    categoryIds: Types.ObjectId[],
    session?: ClientSession | null,
  ) => Promise<CategoryDocument[]>;
  getCategoryByMicrotronId: (
    this: CategoryModel,
    microtronId: string,
    session?: ClientSession | null,
  ) => Promise<CategoryDocument>;
  addCategory: (
    this: CategoryModel,
    categoryData: TAddCategoryToDB,
    session?: ClientSession | null,
  ) => Promise<CategoryDocument>;
  updateCategory: (
    this: CategoryModel,
    categoryId: Types.ObjectId,
    data: TUpdateCategoryInDB,
    session?: ClientSession | null,
  ) => Promise<CategoryDocument>;
  updateAllCategories: (
    this: CategoryModel,
    data: Partial<TUpdateCategoryInDB>,
    session?: ClientSession | null,
  ) => Promise<UpdateWriteOpResult>;
  deleteCategory: (
    this: CategoryModel,
    categoryId: Types.ObjectId,
    session?: ClientSession | null,
  ) => Promise<CategoryDocument>;
};

// STATIC METHODS IMPLEMENTATION
const categoryLogger = new Logger('CategoryModel');
const dataGenerateHelper = new DataGenerateHelper();

CategorySchema.statics.getAllCategories = async function (session) {
  return this.find().session(session).exec();
} as TStaticMethods['getAllCategories'];

CategorySchema.statics.getCategoriesForLoadToSheet = async function (session) {
  const categories = await this.find({ 'sync.loaded': false })
    .session(session)
    .exec();
  return {
    categories,
    count: categories.length,
  };
} as TStaticMethods['getCategoriesForLoadToSheet'];

CategorySchema.statics.getCategoriesByIds = async function (
  categoryIds,
  session,
) {
  if (_.isEmpty(categoryIds)) return [];

  return this.find({
    _id: {
      $in: categoryIds,
    },
  })
    .session(session)
    .exec();
} as TStaticMethods['getCategoriesByIds'];

CategorySchema.statics.getCategoryByMicrotronId = async function (
  microtronId,
  session,
) {
  return this.findOne({ microtronId }).session(session).exec();
} as TStaticMethods['getCategoryByMicrotronId'];

CategorySchema.statics.addCategory = async function (categoryData, session) {
  const parentMicrotronId =
    categoryData.parentId !== '0' ? categoryData.parentId : undefined;

  categoryLogger.debug('Process add Category:', {
    id: categoryData.id,
    name: categoryData.name,
    parentMicrotronId: parentMicrotronId,
  });

  let parent: CategoryDocument | null = null;
  if (parentMicrotronId) {
    categoryLogger.debug('Process find parent Category:', {
      microtronId: categoryData.parentId,
    });

    const result = await this.findOne({
      microtronId: parentMicrotronId,
    })
      .session(session)
      .exec();
    if (result) {
      categoryLogger.debug('Found parent Category:', {
        id: result._id,
        name: result.name,
        microtronId: result.microtronId,
      });

      parent = result;
    }
  }

  const category = new this({
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
    promId: dataGenerateHelper.randomNumber(1, 9, 8),
    parentPromId: parent?.promId,
    integration: categoryData.integrationId,
  });
  await category.save({ session });

  const { matchedCount, modifiedCount } = await this.updateMany(
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
    .session(session)
    .exec();

  categoryLogger.debug('Update Category children result:', {
    matchedCount,
    modifiedCount,
  });

  categoryLogger.debug('Category saved:', {
    microtronId: categoryData.id,
  });

  return category;
} as TStaticMethods['addCategory'];

CategorySchema.statics.updateCategory = async function (
  categoryId,
  data,
  session,
) {
  categoryLogger.debug('Process update Category:', {
    categoryId,
    data,
  });

  const updatedCategory = await this.findOneAndUpdate(
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
    .session(session)
    .exec();

  categoryLogger.debug('Category updated:', {
    categoryId,
  });

  return updatedCategory;
} as TStaticMethods['updateCategory'];

CategorySchema.statics.updateAllCategories = async function (data, session) {
  categoryLogger.debug('Process update all Categories:', {
    data,
  });

  const updateResult = await this.updateMany(
    {},
    {
      $set: data,
    },
  )
    .session(session)
    .exec();

  categoryLogger.debug('Categories update result:', {
    ...updateResult,
  });

  return updateResult;
} as TStaticMethods['updateAllCategories'];

CategorySchema.statics.deleteCategory = async function (categoryId, session) {
  categoryLogger.debug('Process delete Category:', {
    categoryId,
  });

  const removedCategory = await this.findOneAndDelete({
    _id: categoryId,
  })
    .session(session)
    .exec();

  /** @deprecated logic */
  // if (removedCategory.sync.tableLine) {
  //   const { matchedCount, modifiedCount } = await this.updateMany(
  //     {
  //       'sync.tableLine': {
  //         $gt: removedCategory.sync.tableLine,
  //       },
  //     },
  //     [
  //       {
  //         $set: {
  //           'sync.tableLine': {
  //             $subtract: ['$sync.tableLine', 1],
  //           },
  //         },
  //       },
  //     ],
  //   )
  //     .session(session)
  //     .exec();
  //
  //   categoryLogger.debug('Updated Categories with higher table line:', {
  //     matchedCount,
  //     modifiedCount,
  //   });
  // }

  categoryLogger.debug('Category removed:', {
    categoryId,
  });

  return removedCategory;
} as TStaticMethods['deleteCategory'];
