import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Schema as MongooseSchema } from 'mongoose';
import { ConstantEntities } from '@schemas/constant/constant-entities.enum';
import * as _ from 'lodash';
import { Type } from '@nestjs/common';

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
  // MAIN
  getCategories: (this: ConstantModel) => Promise<ConstantDocument | null>;
  upsert: (
    this: ConstantModel,
    name: ConstantEntities,
    value: string,
  ) => Promise<ConstantDocument>;
  upsertCategories: (
    this: ConstantModel,
    value: string,
  ) => Promise<ConstantDocument>;
};

// UTILITIES
ConstantSchema.statics.getParsedValue = function <TReturn>(entity) {
  if (typeof entity === 'string') return JSON.parse(entity);

  return JSON.parse(entity.value) as TReturn;
} as TStaticMethods['getParsedValue'];

// MAIN
ConstantSchema.statics.getCategories = async function () {
  const constant = await this.findOne({
    name: ConstantEntities.CATEGORIES,
  }).exec();

  if (!_.isNull(constant)) {
    return constant;
  }

  return null;
} as TStaticMethods['getCategories'];

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
