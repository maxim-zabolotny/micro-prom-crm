import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { Types as MicrotronTypes } from '@lib/microtron';

export type PromMicrotronProductDocument = PromMicrotronProduct & Document;

@Schema({ _id: false, timestamps: false })
export class PromMicrotronProduct {
  @Prop({ type: Number, required: true })
  externalId: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'products' })
  internalId?: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  hash: string;

  @Prop({ type: String, required: true })
  currency: MicrotronTypes.Currency;

  @Prop({ type: Number, required: true })
  rawPrice: number;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: Number, required: true })
  saleQuantity: number;

  @Prop({ type: String })
  url?: string;

  @Prop({ type: String })
  categoryId: string;

  @Prop({ type: Number })
  categoryCourse: number;

  @Prop({ type: Number })
  categoryMarkup: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'categories' })
  internalCategoryId?: Types.ObjectId;
}

export const PromMicrotronProductSchema =
  SchemaFactory.createForClass(PromMicrotronProduct);
