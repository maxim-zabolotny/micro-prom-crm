import * as _ from 'lodash';
import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Document,
  Model,
  Schema as MongooseSchema,
  SchemaTypes,
  Types,
} from 'mongoose';
import { ProductSaleStatus } from '@schemas/productSale/product-sale-status.enum';
import { Types as PromTypes } from '@lib/prom';
import {
  ProductBooking,
  ProductBookingDocument,
} from '@schemas/productBooking';
import { ProductDocument, ProductSchema } from '@schemas/product';
import { CategoryDocument, CategorySchema } from '@schemas/category';
import { HttpException, HttpStatus, Logger, Type } from '@nestjs/common';
import { ClientSession } from 'mongodb';

// TYPES
export type TProductClient = {
  id: number;
  name: string;
  emails: string[];
  phones: string[];
};

export type TDeliveryProvider = Extract<
  PromTypes.DeliveryProvider,
  PromTypes.DeliveryProvider.NovaPoshta
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

export type TAddProductSaleToDB = Pick<
  ProductSale,
  'count' | 'product' | 'category'
> & {
  productBooking: Pick<ProductBookingDocument, '_id' | 'rawPrice'>;
};

export type TUpdateProductSaleInDB =
  | ({ status: ProductSaleStatus.Delivering } & Omit<TProductDelivery, 'time'>)
  | ({ status: ProductSaleStatus.Sale } & Required<Pick<ProductSale, 'saleAt'>>)
  | ({ status: ProductSaleStatus.Canceled } & Required<
      Pick<ProductSale, 'canceledAt' | 'canceledReason'>
    >);

// MONGOOSE
export type ProductSaleDocument = ProductSale & Document;

export type ProductSaleModel = Model<ProductSaleDocument> & TStaticMethods;

@Schema({ timestamps: true, collection: 'productSales', autoIndex: false })
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

  @Prop({ type: Number })
  promOrderId?: number;

  @Prop({ type: Date })
  saleAt?: Date;

  @Prop({ type: Date })
  canceledAt?: Date;

  @Prop({ type: String })
  canceledReason?: string;

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

export const ProductSaleSchema = SchemaFactory.createForClass(
  ProductSale,
) as unknown as MongooseSchema<Type<ProductSale>, ProductSaleModel>;

// CUSTOM TYPES
type TStaticMethods = {
  getAllSales: (
    this: ProductSaleModel,
    session?: ClientSession | null,
  ) => Promise<ProductSaleDocument[]>;
  findSales: (
    this: ProductSaleModel,
    data: Partial<
      Pick<ProductSale, 'status'> & {
        productName: string;
        productMicrotronId: number;
        productPromId: number;
      }
    >,
    pagination: { limit: number; offset: number },
    session?: ClientSession | null,
  ) => Promise<ProductSaleDocument[]>;
  setSaleDescription: (
    this: ProductSaleModel,
    productSaleId: Types.ObjectId,
    description: string,
    session?: ClientSession | null,
  ) => Promise<ProductSaleDocument>;
  setSaleOrder: (
    this: ProductSaleModel,
    productSaleId: Types.ObjectId,
    promOrderId: number,
    session?: ClientSession | null,
  ) => Promise<ProductSaleDocument>;
  setSaleClient: (
    this: ProductSaleModel,
    productSaleId: Types.ObjectId,
    clientData: TProductClient,
    session?: ClientSession | null,
  ) => Promise<ProductSaleDocument>;
  addSale: (
    this: ProductSaleModel,
    productSaleData: TAddProductSaleToDB,
    session?: ClientSession | null,
  ) => Promise<ProductSaleDocument>;
  updateSale: (
    this: ProductSaleModel,
    productSaleId: Types.ObjectId,
    productSaleData: TUpdateProductSaleInDB,
    session?: ClientSession | null,
  ) => Promise<ProductSaleDocument>;
};

// STATIC METHODS IMPLEMENTATION

const productSaleLogger = new Logger('ProductSaleModel');

ProductSaleSchema.statics.getAllSales = async function (session) {
  return this.find().session(session).exec();
} as TStaticMethods['getAllSales'];

ProductSaleSchema.statics.findSales = async function (
  data,
  { offset, limit },
  session,
) {
  const searchData: Array<Record<string, unknown>> = [];

  if (!_.isEmpty(data.status)) {
    searchData.push({ status: data.status });
  }

  if (!_.isEmpty(data.productName)) {
    searchData.push({
      $or: [
        {
          'product.name': {
            $regex: new RegExp(data.productName),
            $options: 'i',
          },
        },
        {
          'product.translate.name': {
            $regex: new RegExp(data.productName),
            $options: 'i',
          },
        },
      ],
    });
  }

  if (_.isNumber(data.productMicrotronId)) {
    searchData.push({ 'product.microtronId': data.productMicrotronId });
  }

  if (_.isNumber(data.productPromId)) {
    searchData.push({ 'product.promId': data.productPromId });
  }

  return this.find({ $and: searchData })
    .limit(limit)
    .skip(offset)
    .sort({ updatedAt: -1 })
    .session(session)
    .exec();
} as TStaticMethods['findSales'];

ProductSaleSchema.statics.setSaleDescription = async function (
  productSaleId,
  description,
  session,
) {
  productSaleLogger.debug('Process set Product Sale description:', {
    productSaleId,
    description,
  });

  const updatedProductSale = await this.findOneAndUpdate(
    {
      _id: productSaleId,
    },
    {
      $set: {
        description,
      },
    },
    {
      returnOriginal: false,
    },
  )
    .session(session)
    .exec();

  productSaleLogger.debug('Product Sale updated:', {
    id: productSaleId,
  });

  return updatedProductSale;
} as TStaticMethods['setSaleDescription'];

ProductSaleSchema.statics.setSaleOrder = async function (
  productSaleId,
  promOrderId,
  session,
) {
  productSaleLogger.debug('Process set Product Sale Prom Order:', {
    productSaleId,
    promOrderId,
  });

  const updatedProductSale = await this.findOneAndUpdate(
    {
      _id: productSaleId,
    },
    {
      $set: {
        promOrderId,
      },
    },
    {
      returnOriginal: false,
    },
  )
    .session(session)
    .exec();

  productSaleLogger.debug('Product Sale updated:', {
    id: productSaleId,
  });

  return updatedProductSale;
} as TStaticMethods['setSaleOrder'];

ProductSaleSchema.statics.setSaleClient = async function (
  productSaleId,
  clientData,
  session,
) {
  productSaleLogger.debug('Process set Product Sale Prom Client:', {
    productSaleId,
    client: clientData,
  });

  const updatedProductSale = await this.findOneAndUpdate(
    {
      _id: productSaleId,
    },
    {
      $set: {
        client: clientData,
      },
    },
    {
      returnOriginal: false,
    },
  )
    .session(session)
    .exec();

  productSaleLogger.debug('Product Sale updated:', {
    id: productSaleId,
  });

  return updatedProductSale;
} as TStaticMethods['setSaleClient'];

ProductSaleSchema.statics.addSale = async function (productSaleData, session) {
  productSaleLogger.debug('Process add Product Sale:', {
    count: productSaleData.count,
    productId: productSaleData.product._id,
    productName: productSaleData.product.name,
    categoryId: productSaleData.category._id,
    categoryName: productSaleData.category.name,
    productBookingId: productSaleData.productBooking._id,
  });

  const totalPrice = productSaleData.product.ourPrice * productSaleData.count;
  const totalRawPrice =
    productSaleData.productBooking.rawPrice * productSaleData.count;

  const benefitPrice = Math.max(totalPrice - totalRawPrice, 0);

  const productSale = new this({
    status: ProductSaleStatus.WaitDeliver,
    count: productSaleData.count,
    totalPrice: totalPrice,
    benefitPrice: benefitPrice,
    productBooking: productSaleData.productBooking._id,
    product: productSaleData.product,
    category: productSaleData.category,
    history: [
      {
        status: ProductSaleStatus.WaitDeliver,
        time: new Date(),
      },
    ],
  });
  await productSale.save({ session });

  productSaleLogger.debug('Product sale saved:', {
    productSaleId: productSale._id,
    totalPrice,
    benefitPrice,
  });

  return productSale;
} as TStaticMethods['addSale'];

ProductSaleSchema.statics.updateSale = async function (
  productSaleId,
  data,
  session,
) {
  productSaleLogger.debug('Process update Product Sale:', {
    productSaleId,
    data,
  });

  productSaleLogger.debug('Load old Product Sale version');
  const oldProductSale = await this.findById(productSaleId)
    .session(session)
    .exec();
  if (!oldProductSale) {
    throw new HttpException('Product Sale not found', HttpStatus.NOT_FOUND);
  }

  let dataForUpdate: Partial<ProductSale>;
  switch (data.status) {
    case ProductSaleStatus.Delivering: {
      if (oldProductSale.status !== ProductSaleStatus.WaitDeliver) {
        throw new HttpException(
          'Before status Delivering have to go WaitDeliver',
          HttpStatus.BAD_REQUEST,
        );
      }

      dataForUpdate = {
        status: data.status,
        delivery: {
          provider: data.provider,
          declarationId: data.declarationId,
          time: new Date(),
        },
      };

      break;
    }
    case ProductSaleStatus.Sale: {
      if (oldProductSale.status !== ProductSaleStatus.Delivering) {
        throw new HttpException(
          'Before status Sale have to go Delivering',
          HttpStatus.BAD_REQUEST,
        );
      }

      dataForUpdate = {
        status: data.status,
        saleAt: data.saleAt,
      };

      break;
    }
    case ProductSaleStatus.Canceled: {
      if (oldProductSale.status === data.status) {
        throw new HttpException(
          'Product Sale has already been canceled',
          HttpStatus.BAD_REQUEST,
        );
      }

      dataForUpdate = {
        status: data.status,
        canceledAt: data.canceledAt,
        canceledReason: data.canceledReason,
      };

      break;
    }
  }

  const updatedProductSale = await this.findOneAndUpdate(
    {
      _id: productSaleId,
    },
    {
      $set: dataForUpdate,
      $push: {
        history: {
          status: data.status,
          time: new Date(),
        },
      },
    },
    {
      returnOriginal: false,
    },
  )
    .session(session)
    .exec();

  productSaleLogger.debug('Product Sale updated:', {
    id: productSaleId,
  });

  return updatedProductSale;
} as TStaticMethods['updateSale'];
