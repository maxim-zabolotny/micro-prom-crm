import * as _ from 'lodash';
import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, SchemaTypes, Types } from 'mongoose';
import { ProductBookingStatus } from '@schemas/productBooking/product-booking-status.enum';
import { Product, ProductDocument } from '@schemas/product';
import { ClientSession } from 'mongodb';
import { CategoryDocument } from '@schemas/category';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';

// TYPES
export type TInnerProduct = { id: Types.ObjectId } & Pick<
  Product,
  'name' | 'microtronId'
>;

export type TProductBookingHistory = {
  status: ProductBookingStatus;
  time: Date;
  byUser: Types.ObjectId;
};

export type TAddProductBookingToDB = Pick<
  ProductBooking,
  'description' | 'count'
> & {
  product: ProductDocument;
  byUser: Types.ObjectId;
};

export type TUpdateProductBookingInDB = Pick<
  ProductBooking,
  'status' | 'rawPrice' | 'disapproveReason'
> & {
  byUser: Types.ObjectId;
};

// MONGOOSE
export type ProductBookingDocument = ProductBooking & Document;

export type ProductBookingModel = Model<ProductBookingDocument> &
  TStaticMethods;

@Schema({ timestamps: true, collection: 'productBookings' })
export class ProductBooking {
  @Prop({
    type: String,
    required: true,
    enum: [...Object.values(ProductBookingStatus)],
  })
  status: ProductBookingStatus;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Number, required: true })
  count: number;

  @Prop({ type: String })
  disapproveReason?: string;

  @Prop({ type: Number })
  rawPrice?: number;

  @Prop({
    type: raw({
      _id: false,
      id: { type: SchemaTypes.ObjectId, ref: 'products', required: true },
      name: { type: String, required: true },
      microtronId: { type: Number, required: true },
    }),
    required: true,
  })
  product: TInnerProduct;

  @Prop({
    type: [
      raw({
        _id: false,
        status: {
          type: String,
          required: true,
          enum: [...Object.values(ProductBookingStatus)],
        },
        time: { type: Date, required: true, default: new Date() },
        byUser: { type: SchemaTypes.ObjectId, ref: 'users', required: true },
      }),
    ],
    required: true,
  })
  history: TProductBookingHistory[];
}

export const ProductBookingSchema =
  SchemaFactory.createForClass(ProductBooking);

// CUSTOM TYPES
type TStaticMethods = {
  getAllBookings: (
    this: ProductBookingModel,
    session?: ClientSession | null,
  ) => Promise<ProductBookingDocument[]>;
  getWithProductAndCategory: (
    this: ProductBookingModel,
    id: Types.ObjectId,
    session?: ClientSession | null,
  ) => Promise<
    Array<
      Omit<ProductBookingDocument, 'product'> & {
        product: ProductDocument;
        category: CategoryDocument;
      }
    >
  >;
  findBookings: (
    this: ProductBookingModel,
    data: Partial<Pick<ProductBooking, 'status'>>,
    pagination: { limit: number; offset: number },
    session?: ClientSession | null,
  ) => Promise<ProductBookingDocument[]>;
  addBooking: (
    this: ProductBookingModel,
    productBookingData: TAddProductBookingToDB,
    session?: ClientSession | null,
  ) => Promise<ProductBookingDocument>;
  updateBooking: (
    this: ProductBookingModel,
    productBookingId: Types.ObjectId,
    productBookingData: TUpdateProductBookingInDB,
    session?: ClientSession | null,
  ) => Promise<ProductBookingDocument>;
};

// STATIC METHODS IMPLEMENTATION

const productBookingLogger = new Logger('ProductBookingModel');

ProductBookingSchema.statics.getAllBookings = async function (session) {
  return this.find().session(session).exec();
} as TStaticMethods['getAllBookings'];

ProductBookingSchema.statics.getWithProductAndCategory = async function (
  id,
  session,
) {
  return this.aggregate([
    { $match: { _id: id } },
    {
      $lookup: {
        from: 'products',
        localField: 'product.id',
        foreignField: '_id',
        as: 'products',
      },
    },
    { $unset: 'product' },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            { product: { $arrayElemAt: ['products', 0] } },
            '$$ROOT',
          ],
        },
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'product.category',
        foreignField: '_id',
        as: 'category',
      },
    },
    {
      $unwind: '$category',
    },
  ])
    .session(session)
    .exec();
} as TStaticMethods['getWithProductAndCategory'];

ProductBookingSchema.statics.findBookings = async function (
  data,
  { offset, limit },
  session,
) {
  const searchData = {};

  if ('status' in data) {
    searchData['status'] = data.status;
  }

  return this.find(searchData)
    .limit(limit)
    .skip(offset)
    .sort({ updatedAt: -1 })
    .session(session)
    .exec();
} as TStaticMethods['findBookings'];

ProductBookingSchema.statics.addBooking = async function (
  productBookingData,
  session,
) {
  productBookingLogger.debug('Process add Product Booking:', {
    count: productBookingData.count,
    description: productBookingData.description,
    productId: productBookingData.product._id,
    productName: productBookingData.product.name,
    productMicrotronId: productBookingData.product.microtronId,
  });

  const productBooking = new this({
    status: ProductBookingStatus.Wait,
    description: productBookingData.description,
    count: productBookingData.count,
    product: {
      id: productBookingData.product._id,
      name: productBookingData.product.name,
      microtronId: productBookingData.product.microtronId,
    },
    history: [
      {
        status: ProductBookingStatus.Wait,
        time: new Date(),
        byUser: productBookingData.byUser,
      },
    ],
  });
  await productBooking.save({ session });

  productBookingLogger.debug('Product booking saved:', {
    productBookingId: productBooking._id,
    productId: productBookingData.product._id,
    productName: productBookingData.product.name,
  });

  return productBooking;
} as TStaticMethods['addBooking'];

ProductBookingSchema.statics.updateBooking = async function (
  productBookingId,
  data,
  session,
) {
  productBookingLogger.debug('Process update Product booking:', {
    productBookingId,
    data,
  });

  productBookingLogger.debug('Load old product booking version');
  const oldProductBooking = await this.findById(productBookingId)
    .session(session)
    .exec();
  if (!oldProductBooking) {
    throw new HttpException('Product booking not found', HttpStatus.NOT_FOUND);
  }

  if (oldProductBooking.status !== ProductBookingStatus.Wait) {
    throw new HttpException(
      'Cannot change Product Booking status after Approve or Disapprove',
      HttpStatus.BAD_REQUEST,
    );
  }

  const dataForUpdate = _.pick(data, ['rawPrice', 'disapproveReason']);

  const updatedProductBooking = await this.findOneAndUpdate(
    {
      _id: productBookingId,
    },
    {
      $set: {
        ...dataForUpdate,
        status: data.status,
      },
      $push: {
        history: {
          status: data.status,
          time: new Date(),
          byUser: data.byUser,
        },
      },
    },
    {
      returnOriginal: false,
    },
  )
    .session(session)
    .exec();

  productBookingLogger.debug('Product Booking updated:', {
    id: productBookingId,
  });

  return updatedProductBooking;
} as TStaticMethods['updateBooking'];
