import * as _ from 'lodash';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Schema as MongooseSchema, Types } from 'mongoose';
import { HttpException, HttpStatus, Logger, Type } from '@nestjs/common';
import {
  PromOrderSub,
  PromOrderSubSchema,
} from '@schemas/promOrder/prom-order-sub.schema';
import {
  PromOrderProduct,
  PromOrderProductSchema,
} from '@schemas/promOrder/prom-order-product.schema';
import {
  PromMicrotronProduct,
  PromMicrotronProductSchema,
} from '@schemas/promOrder/prom-microtron-product.schema';
import { Order as LibPromOrder } from '@lib/prom';
import { ClientSession } from 'mongodb';
import { DataUtilsHelper } from '@common/helpers';

// TYPES
export type TUpdatePromOrderInDB =
  | { productsToAdd: PromMicrotronProduct[] }
  | { status: LibPromOrder.OrderStatus };

// MONGOOSE
export type PromOrderDocument = PromOrder & Document;

export type PromOrderModel = Model<PromOrderDocument> & TStaticMethods;

@Schema({ timestamps: true, collection: 'promOrders' })
export class PromOrder {
  @Prop({ type: Boolean, required: true })
  sold: boolean;

  @Prop({ type: Boolean, required: true })
  complete: boolean;

  @Prop({ type: Number, required: true })
  benefitPrice: number;

  @Prop({ type: PromOrderSubSchema, required: true })
  order: PromOrderSub;

  @Prop({ type: [PromOrderProductSchema], required: true })
  orderProducts: PromOrderProduct[];

  @Prop({ type: [PromMicrotronProductSchema], required: true })
  microtronProducts: PromMicrotronProduct[];
}

export const PromOrderSchema = SchemaFactory.createForClass(
  PromOrder,
) as unknown as MongooseSchema<Type<PromOrder>, PromOrderModel>;

// CUSTOM TYPES
type TStaticMethods = {
  getAllOrders: (
    this: PromOrderModel,
    session?: ClientSession | null,
  ) => Promise<PromOrderDocument[]>;
  getIncompleteOrders: (
    this: PromOrderModel,
    session?: ClientSession | null,
  ) => Promise<PromOrderDocument[]>;
  addOrder: (
    this: PromOrderModel,
    promOrderData: LibPromOrder.IOrder,
    session?: ClientSession | null,
  ) => Promise<PromOrderDocument>;
  updateOrder: (
    this: PromOrderModel,
    promOrderId: Types.ObjectId,
    promOrderData: TUpdatePromOrderInDB,
    session?: ClientSession | null,
  ) => Promise<PromOrderDocument>;
};

// STATIC METHODS IMPLEMENTATION

const promOrderLogger = new Logger('PromOrderModel');
const dataUtilHelper = new DataUtilsHelper();

PromOrderSchema.statics.getAllOrders = async function (session) {
  return this.find().session(session).exec();
} as TStaticMethods['getAllOrders'];

PromOrderSchema.statics.getIncompleteOrders = async function (session) {
  return this.find({ complete: false }).session(session).exec();
} as TStaticMethods['getIncompleteOrders'];

PromOrderSchema.statics.addOrder = async function (promOrderData, session) {
  promOrderLogger.debug('Process add Prom Order:', {
    id: promOrderData.id,
    price: promOrderData.price,
    clientName: `${promOrderData.client_first_name} ${promOrderData.client_last_name}`,
    productsCount: promOrderData.products.length,
  });

  const convertToNum = (price: string) =>
    Number(parseFloat(price.replace(/\s/g, '')).toFixed(3));

  const sold = [
    LibPromOrder.OrderStatus.Received,
    LibPromOrder.OrderStatus.Delivered,
    LibPromOrder.OrderStatus.Paid,
  ].includes(promOrderData.status);

  const order = {
    externalId: promOrderData.id,
    status: promOrderData.status,
    clientName: _.compact([
      promOrderData.client_first_name,
      promOrderData.client_last_name,
    ]).join(' '),
    clientPhone: promOrderData.phone,
    totalPrice: convertToNum(promOrderData.price),
    createdAt: new Date(promOrderData.date_created),
  };

  const orderProducts = promOrderData.products.map((product) => ({
    externalId: product.id,
    internalId: product.external_id
      ? new Types.ObjectId(product.external_id)
      : null,
    name: product.name,
    hash: dataUtilHelper.getSHA256(product.name),
    quantity: product.quantity,
    price: convertToNum(product.price),
    totalPrice: convertToNum(product.total_price),
  }));

  const promOrder = new this({
    sold: sold,
    complete: false,
    benefitPrice: 0,
    order: order,
    orderProducts: orderProducts,
    microtronProducts: [],
  });
  await promOrder.save({ session });

  promOrderLogger.debug('Prom Order saved:', {
    promOrderId: promOrder._id,
  });

  return promOrder;
} as TStaticMethods['addOrder'];

PromOrderSchema.statics.updateOrder = async function (
  promOrderId,
  data,
  session,
) {
  promOrderLogger.debug('Process update Prom Orders:', {
    promOrderId,
    data,
  });

  promOrderLogger.debug('Load old prom Order version');
  const oldPromOrder = await this.findById(promOrderId).session(session).exec();
  if (!oldPromOrder) {
    throw new HttpException('Prom Order not found', HttpStatus.NOT_FOUND);
  }

  // 1. STATUS CASE
  if ('status' in data) {
    const updatedPromOrder = await this.findOneAndUpdate(
      {
        _id: promOrderId,
      },
      {
        $set: {
          sold: [
            LibPromOrder.OrderStatus.Received,
            LibPromOrder.OrderStatus.Delivered,
            LibPromOrder.OrderStatus.Paid,
          ].includes(data.status),
          'order.status': data.status,
        },
      },
      {
        returnOriginal: false,
      },
    )
      .session(session)
      .exec();

    promOrderLogger.debug('Prom Order updated:', {
      id: promOrderId,
    });

    return updatedPromOrder;
  }

  // 2. PRODUCTS TO ADD CASE
  if ('productsToAdd' in data) {
    const isComplete =
      oldPromOrder.orderProducts.length >=
      oldPromOrder.microtronProducts.length + data.productsToAdd.length;

    let benefitPrice = 0;
    if (isComplete) {
      const benefit =
        oldPromOrder.order.totalPrice -
        _.reduce(
          [...oldPromOrder.microtronProducts, ...data.productsToAdd],
          (acc, product) => acc + product.price * product.saleQuantity,
          0,
        );

      benefitPrice = Number(benefit.toFixed(3));
    }

    const updatedPromOrder = await this.findOneAndUpdate(
      {
        _id: promOrderId,
      },
      {
        $set: {
          benefitPrice,
          complete: isComplete,
        },
        $push: {
          microtronProducts: data.productsToAdd,
        },
      },
      {
        returnOriginal: false,
      },
    )
      .session(session)
      .exec();

    promOrderLogger.debug('Prom Order updated:', {
      id: promOrderId,
    });

    return updatedPromOrder;
  }
} as TStaticMethods['updateOrder'];
