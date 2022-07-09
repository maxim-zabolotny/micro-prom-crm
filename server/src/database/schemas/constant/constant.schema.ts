import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ConstantEntities } from '@schemas/constant/constant.entities';

export type ConstantDocument = Constant & Document;

@Schema({ timestamps: true, collection: 'constants' })
export class Constant {
  @Prop({
    type: String,
    unique: true,
    isRequired: true,
    enum: [...Object.values(ConstantEntities)],
  })
  name: ConstantEntities;

  @Prop({ type: String, isRequired: true })
  value: string;
}

export const ConstantSchema = SchemaFactory.createForClass(Constant);
