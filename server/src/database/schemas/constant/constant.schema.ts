import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ConstantEntities } from '@schemas/constant/constant-entities.enum';

export type ConstantDocument = Constant & Document;

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
