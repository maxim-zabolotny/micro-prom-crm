import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { Category } from '@schemas/category';

export type ProductDocument = Product & Document;

export type TProductTranslate = Pick<Product, 'name' | 'description'>;

@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({
    type: raw({
      _id: false,
      name: { type: String, required: true },
      description: { type: String, required: true },
    }),
    required: true,
  })
  translate: TProductTranslate;

  @Prop({ type: String, required: true })
  brand: string;

  @Prop({ type: raw({ type: Map, of: String }), required: true })
  specifications: string;

  @Prop({ type: Number, required: true })
  originalPrice: number;

  @Prop({ type: Number, required: true })
  sitePrice: number;

  @Prop({ type: Number, required: true })
  ourPrice: number;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: Number, required: true })
  warranty: number;

  @Prop({ type: String, required: true })
  vendorCode: string;

  @Prop({ type: String, required: true })
  UKTZED: string;

  @Prop({ type: String, required: true })
  url: string;

  @Prop({ type: [String], required: true })
  images: string[];

  @Prop({ type: Boolean, required: true })
  new: boolean;

  @Prop({ type: Boolean, required: true })
  available: boolean;

  @Prop({ type: Boolean, required: true, default: false })
  sync: boolean;

  @Prop({ type: Date })
  syncAt?: Date;

  @Prop({ type: Number })
  promTableLine?: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'categories', required: true })
  category: Category;

  @Prop({ type: String, required: true, unique: true })
  microtronId: string;

  @Prop({ type: Number, required: true, unique: true })
  promId: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
