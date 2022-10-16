import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Order as PromOrder } from '@lib/prom';

export type PromOrderSubDocument = PromOrderSub & Document;

@Schema({ _id: false, timestamps: false })
export class PromOrderSub {
  @Prop({ type: Number, required: true })
  externalId: number;

  @Prop({
    type: String,
    required: true,
    enum: [...Object.values(PromOrder.OrderStatus)],
  })
  status: PromOrder.OrderStatus;

  @Prop({ type: String })
  clientName?: string;

  @Prop({ type: String })
  clientPhone?: string;

  @Prop({ type: Number, required: true })
  totalPrice: number;

  @Prop({ type: Date, required: true })
  createdAt: Date;
}

export const PromOrderSubSchema = SchemaFactory.createForClass(PromOrderSub);
