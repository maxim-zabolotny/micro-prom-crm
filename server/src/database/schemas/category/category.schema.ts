import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { Integration } from '@schemas/integration';

export type CategoryDocument = Category & Document;

export type TCategoryTranslate = Pick<Category, 'name'>;

@Schema({ timestamps: true, collection: 'categories' })
export class Category {
  @Prop({ type: String, required: true, unique: true })
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

  @Prop({ type: SchemaTypes.ObjectId, ref: 'categories' })
  parent?: Category;

  @Prop({ type: Boolean, required: true, default: false })
  sync: boolean;

  @Prop({ type: Number })
  promTableLine?: number;

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

export const CategorySchema = SchemaFactory.createForClass(Category);
