import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { Integration } from '@schemas/integration';

export type CategoryDocument = Category & Document;

export type TCategoryTranslate = Pick<Category, 'name'>;

@Schema({ timestamps: true, collection: 'categories' })
export class Category {
  @Prop({ type: String, isRequired: true })
  name: string;

  @Prop({ type: Number, isRequired: true })
  markup: number;

  @Prop({ type: Number, isRequired: true })
  course: number;

  @Prop({
    type: raw({
      name: { type: String, isRequired: true },
    }),
    isRequired: true,
  })
  translate: TCategoryTranslate;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'categories' })
  parent?: Category;

  @Prop({ type: Boolean, isRequired: true, default: false })
  sync: boolean;

  @Prop({ type: Number })
  promTableLine?: number;

  @Prop({ type: String, isRequired: true })
  microtronId: string;

  @Prop({ type: String })
  parentMicrotronId?: string;

  @Prop({ type: Number, isRequired: true })
  promId: number;

  @Prop({ type: Number })
  parentPromId?: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'integration', isRequired: true })
  integration: Integration;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
