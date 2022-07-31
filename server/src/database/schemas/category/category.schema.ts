import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Integration } from '@schemas/integration';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true, collection: 'categories' })
export class Category {
  @Prop({ type: Types.ObjectId, ref: 'integration', isRequired: true })
  integration: Integration;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
