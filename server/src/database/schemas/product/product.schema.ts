import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { Category } from '@schemas/category';
import { Types as MicrotronTypes } from '@lib/microtron';
import {
  ProductSync,
  ProductSyncSchema,
} from '@schemas/product/product-sync.schema';

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

  @Prop({
    type: SchemaTypes.Mixed,
    required: true,
  })
  specifications: Record<string, string>;

  @Prop({ type: Number, required: true })
  sitePrice: number;

  @Prop({ type: Number, required: true })
  siteMarkup: number;

  @Prop({ type: String, required: true })
  originalPriceCurrency: MicrotronTypes.Currency;

  @Prop({ type: Number, required: true })
  originalPrice: number;

  @Prop({ type: Number, required: true })
  ourPrice: number;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: Number, required: true })
  warranty: number;

  @Prop({ type: String })
  vendorCode: string;

  @Prop({ type: String })
  UKTZED: string;

  @Prop({ type: String, required: true })
  url: string;

  @Prop({ type: [String], required: true })
  images: string[];

  @Prop({ type: Boolean, required: true })
  new: boolean;

  @Prop({ type: Boolean, required: true })
  available: boolean;

  @Prop({ type: ProductSyncSchema, required: true })
  sync: ProductSync;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'categories', required: true })
  category: Category;

  @Prop({ type: Number, required: true, unique: true })
  microtronId: number;

  @Prop({ type: Number, required: true, unique: true })
  promId: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
