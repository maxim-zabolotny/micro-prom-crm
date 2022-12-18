import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Schema as MongooseSchema } from 'mongoose';
import { ConstantEntities } from '@schemas/constant/constant-entities.enum';
import * as _ from 'lodash';
import { Type } from '@nestjs/common';
import { ICategoryInConstant } from '@common/interfaces/category';
import { IExcludedProductsConstant } from '@common/interfaces/constant';

// MONGOOSE
export type ConstantDocument = Constant & Document;

export type ConstantModel = Model<ConstantDocument> & TStaticMethods;

@Schema({ timestamps: true, collection: 'constants' })
export class Constant {
  @Prop({
    type: String,
    unique: true,
    required: true,
    enum: [...Object.values(ConstantEntities)],
  })
  name: ConstantEntities;

  @Prop({ type: String, required: true })
  value: string;
}

export const ConstantSchema = SchemaFactory.createForClass(
  Constant,
) as unknown as MongooseSchema<Type<Constant>, ConstantModel>;

// CUSTOM TYPES
type TStaticMethods = {
  // UTILITIES
  getParsedValue: <TReturn>(
    this: ConstantModel,
    value: string | ConstantDocument,
  ) => TReturn;
  getParsedCategories: (
    this: ConstantModel,
    value: string | ConstantDocument,
  ) => ICategoryInConstant[];
  getParsedExcludedProducts: (
    this: ConstantModel,
    value: string | ConstantDocument,
  ) => IExcludedProductsConstant;
  // MAIN
  getConstant: (
    this: ConstantModel,
    name: ConstantEntities,
  ) => Promise<ConstantDocument | null>;
  getCategories: (this: ConstantModel) => Promise<ConstantDocument | null>;
  getExcludedProducts: (
    this: ConstantModel,
  ) => Promise<ConstantDocument | null>;
  upsert: (
    this: ConstantModel,
    name: ConstantEntities,
    value: string,
  ) => Promise<ConstantDocument>;
  upsertCategories: (
    this: ConstantModel,
    value: string,
  ) => Promise<ConstantDocument>;
  upsertExcludedProducts: (
    this: ConstantModel,
    value: string,
  ) => Promise<ConstantDocument>;
};

// UTILITIES
ConstantSchema.statics.getParsedValue = function <TReturn>(entity) {
  if (typeof entity === 'string') return JSON.parse(entity);

  return JSON.parse(entity.value) as TReturn;
} as TStaticMethods['getParsedValue'];

ConstantSchema.statics.getParsedCategories = function (entity) {
  return this.getParsedValue(entity);
} as TStaticMethods['getParsedCategories'];

ConstantSchema.statics.getParsedExcludedProducts = function (entity) {
  return this.getParsedValue(entity);
} as TStaticMethods['getParsedExcludedProducts'];

// MAIN
ConstantSchema.statics.getConstant = async function (name) {
  const constant = await this.findOne({ name }).exec();

  if (!_.isNull(constant)) {
    return constant;
  }

  return null;
} as TStaticMethods['getConstant'];

ConstantSchema.statics.getCategories = async function () {
  return await this.getConstant(ConstantEntities.CATEGORIES);
} as TStaticMethods['getCategories'];

ConstantSchema.statics.getExcludedProducts = async function () {
  return await this.getConstant(ConstantEntities.EXCLUDED_PRODUCTS);
} as TStaticMethods['getExcludedProducts'];

ConstantSchema.statics.upsert = async function (name, value) {
  const constant = await this.findOneAndUpdate(
    {
      name,
    },
    {
      $set: {
        value,
      },
    },
    {
      upsert: true,
      new: true,
    },
  );

  return constant;
} as TStaticMethods['upsert'];

ConstantSchema.statics.upsertCategories = async function (value) {
  return await this.upsert(ConstantEntities.CATEGORIES, value);
} as TStaticMethods['upsertCategories'];

ConstantSchema.statics.upsertExcludedProducts = async function (value) {
  return await this.upsert(ConstantEntities.EXCLUDED_PRODUCTS, value);
} as TStaticMethods['upsertExcludedProducts'];
