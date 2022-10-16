import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

export type PromOrderProductDocument = PromOrderProduct & Document;

@Schema({ _id: false, timestamps: false })
export class PromOrderProduct {
  @Prop({ type: Number })
  externalId?: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'products' })
  internalId?: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  hash: string;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: Number, required: true })
  totalPrice: number;
}

export const PromOrderProductSchema =
  SchemaFactory.createForClass(PromOrderProduct);
