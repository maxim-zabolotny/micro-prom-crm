import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, SchemaTypes } from 'mongoose';
import { ProductSaleStatus } from '@schemas/productSale/product-sale-status.enum';
import { Types } from '@lib/prom';
import { ProductBooking } from '@schemas/productBooking';
import { ProductDocument, ProductSchema } from '@schemas/product';
import { CategoryDocument, CategorySchema } from '@schemas/category';

// TYPES
export type TProductClient = {
  id: number;
  name: string;
  emails: string[];
  phones: string[];
};

export type TDeliveryProvider = Extract<
  Types.DeliveryProvider,
  Types.DeliveryProvider.NovaPoshta | Types.DeliveryProvider.UkrPoshta
>;

export type TProductDelivery = {
  provider: TDeliveryProvider;
  declarationId: string;
  time: Date;
};

export type TProductSaleHistory = {
  status: ProductSaleStatus;
  time: Date;
};

// MONGOOSE
export type ProductSaleDocument = ProductSale & Document;

export type ProductSaleModel = Model<ProductSaleDocument> & TStaticMethods;

@Schema({ timestamps: true, collection: 'productSales' })
export class ProductSale {
  @Prop({
    type: String,
    required: true,
    enum: [...Object.values(ProductSaleStatus)],
  })
  status: ProductSaleStatus;

  @Prop({ type: Number, required: true })
  count: number;

  @Prop({ type: Number, required: true })
  totalPrice: number;

  @Prop({ type: Number, required: true })
  benefitPrice: number;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: String })
  canceledReason?: string;

  @Prop({ type: Number })
  promOrderId?: number;

  @Prop({ type: Date })
  saleAt?: Date;

  @Prop({
    type: raw({
      _id: false,
      id: { type: Number, required: true },
      name: { type: String, required: true },
      emails: { type: [String], required: true },
      phones: { type: [String], required: true },
    }),
  })
  client?: TProductClient;

  @Prop({
    type: raw({
      _id: false,
      provider: { type: String, required: true },
      declarationId: { type: String, required: true },
      time: { type: Date, required: true },
    }),
  })
  delivery?: TProductDelivery;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'productBookings', required: true })
  productBooking: ProductBooking;

  @Prop({ type: ProductSchema, required: true })
  product: ProductDocument;

  @Prop({ type: CategorySchema, required: true })
  category: CategoryDocument;

  @Prop({
    type: [
      raw({
        _id: false,
        status: {
          type: String,
          required: true,
          enum: [...Object.values(ProductSaleStatus)],
        },
        time: { type: Date, required: true, default: new Date() },
      }),
    ],
    required: true,
  })
  history: TProductSaleHistory[];
}

export const ProductSaleSchema = SchemaFactory.createForClass(ProductSale);

// CUSTOM TYPES
type TStaticMethods = {};

// STATIC METHODS IMPLEMENTATION
