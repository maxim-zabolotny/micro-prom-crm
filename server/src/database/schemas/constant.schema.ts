import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConstantDocument = Constant & Document;

@Schema()
export class Constant {
  @Prop({
    type: String,
    unique: true,
    isRequired: true,
    enum: [...Object.values(Constant.ENTITIES)],
  })
  name: string;

  @Prop({ type: String, isRequired: true })
  value: string;

  static ENTITIES = {
    CATEGORIES: 'categories',
  };
}

export const ConstantSchema = SchemaFactory.createForClass(Constant);
