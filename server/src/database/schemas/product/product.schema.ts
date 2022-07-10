import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Integration } from '@schemas/integration';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @Prop({ type: Types.ObjectId, ref: 'integration', isRequired: true })
  integration: Integration;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
