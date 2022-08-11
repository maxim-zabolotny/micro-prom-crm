/*external modules*/
/*lib*/
/*types*/
import {
  DeliveryProvider, DeliveryType, IPagination, ITimestampPeriod,
} from '../types/api';
/*other*/

// ENTITY
export enum OrderStatus {
  Pending = 'pending',
  Received = 'received',
  Delivered = 'delivered',
  Canceled = 'canceled',
  Draft = 'draft',
  Paid = 'paid',
}

export enum OrderSource {
  Portal = 'portal',
  CompanySite = 'company_site',
  CompanyCabinet = 'company_cabinet',
  MobileApp = 'mobile_app',
  Bigl = 'bigl'
}

export enum OrderCancellationReason {
  NotAvailable = 'not_available',
  PriceChanged = 'price_changed',
  BuyersRequest = 'buyers_request',
  NotEnoughFields = 'not_enough_fields',
  Duplicate = 'duplicate',
  InvalidPhoneNumber = 'invalid_phone_number',
  LessThanMinimalPrice = 'less_than_minimal_price',
  Another = 'another'
}

export enum PaymentType {
  EvoPay = 'evopay'
}

export enum PaymentStatus {
  Paid = 'paid',
  Unpaid = 'unpaid',
  Refunded = 'refunded',
  PaidOut = 'paid_out',
}

export interface IOrderProduct {
  id: number;
  external_id: string;
  image: string;
  quantity: number;
  price: string;
  url: string;
  name: string;
  total_price: string;
  measure_unit: string;
  sku: string;
}

export interface IOrderDeliveryOption {
  id: number;
  name: string;
}

export interface IOrderDeliveryProviderData {
  provider: DeliveryProvider;
  type: DeliveryType;
  sender_warehouse_id: string | null;
  recipient_warehouse_id: string | null;
  declaration_number: string;
}

export interface IOrderPaymentOption {
  id: number;
  name: string;
}

export interface IOrderPaymentData {
  type: PaymentType;
  status: PaymentStatus;
  status_modified: string;
}

export interface IOrder {
  id: number;
  date_created: string;
  client_first_name: string;
  client_second_name: string;
  client_last_name: string;
  client_id: number;
  client_notes: string;
  products: IOrderProduct[]
  phone: string;
  email: string;
  price: string;
  delivery_option: IOrderDeliveryOption
  delivery_provider_data: IOrderDeliveryProviderData | null;
  delivery_address: string;
  payment_option: IOrderPaymentOption;
  payment_data: IOrderPaymentData;
  status: OrderStatus;
  source: OrderSource;
}

// REQUEST
export interface IGetOrdersListQueryParams extends Partial<IPagination>, Partial<ITimestampPeriod> {
  status?: OrderStatus;
}

export interface IPostOrdersSetStatusDefaultBody {
  status: Exclude<OrderStatus, OrderStatus.Canceled>;
  ids: number[];
}

export interface IPostOrdersSetStatusCanceledBody {
  status: OrderStatus.Canceled;
  ids: number[];
  cancellation_reason: OrderCancellationReason;
  cancellation_text?: string;
}

export type TPostOrdersSetStatusBody =
  | IPostOrdersSetStatusDefaultBody
  | IPostOrdersSetStatusCanceledBody;

export interface IPostOrdersRefundBody {
  ids: number[];
}

// RESPONSE
export type TGetOrdersListResponse = Record<'orders', IOrder[]>
export type TGetOrderByIdResponse = Record<'order', IOrder>

export type TPostOrdersSetStatusResponse = Record<'processed_ids', number[]>
export type TPostOrdersRefundResponse = Record<'processed_ids', number[]>
