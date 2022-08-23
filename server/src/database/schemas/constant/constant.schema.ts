import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';
import { ConstantEntities } from '@schemas/constant/constant-entities.enum';
import * as _ from 'lodash';

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

export const ConstantSchema = SchemaFactory.createForClass(Constant);

// CUSTOM TYPES
type TStaticMethods = {
  getCategories: (this: ConstantModel) => Promise<ConstantDocument | null>;
};

ConstantSchema.statics.getCategories = async function () {
  const categories = await this.findOne({
    name: ConstantEntities.CATEGORIES,
  }).exec();

  if (!_.isNull(categories)) {
    return categories;
  }

  return null;
} as TStaticMethods['getCategories'];
