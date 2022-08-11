/*external modules*/
import _ from 'lodash';
import urlJoin from 'url-join';
/*lib*/
import { HttpMethods, Request } from '../request';
/*types*/
import {
  IGetOrdersListQueryParams,
  IOrder,
  IOrderDeliveryOption,
  IOrderDeliveryProviderData,
  IOrderPaymentData,
  IOrderPaymentOption,
  IOrderProduct,
  IPostOrdersRefundBody,
  IPostOrdersSetStatusCanceledBody,
  IPostOrdersSetStatusDefaultBody,
  OrderCancellationReason,
  OrderSource,
  OrderStatus,
  PaymentStatus,
  PaymentType,
  TGetOrderByIdResponse,
  TGetOrdersListResponse,
  TPostOrdersRefundResponse,
  TPostOrdersSetStatusBody,
  TPostOrdersSetStatusResponse,
} from './IOrder';
/*other*/

export {
  OrderStatus,
  OrderSource,
  OrderCancellationReason,
  PaymentType,
  PaymentStatus,

  IOrderProduct,
  IOrderDeliveryOption,
  IOrderDeliveryProviderData,
  IOrderPaymentOption,
  IOrderPaymentData,
  IOrder,

  IGetOrdersListQueryParams,
  IPostOrdersSetStatusDefaultBody,
  IPostOrdersSetStatusCanceledBody,
  TPostOrdersSetStatusBody,
  IPostOrdersRefundBody,

  TGetOrdersListResponse,
  TGetOrderByIdResponse,
  TPostOrdersSetStatusResponse,
  TPostOrdersRefundResponse,
};

export class Order extends Request {
  protected buildUrl(path: string | number): string {
    return urlJoin(Order.BASE_PATH, String(path));
  }

  public async getOrdersList(params: IGetOrdersListQueryParams = {}): Promise<TGetOrdersListResponse> {
    const { date_to, date_from } = params;
    const queryParams = { ...params };

    if (date_to) {
      queryParams.date_to = _.isDate(date_to) ? date_to.toString() : date_to;
    }

    if (date_from) {
      queryParams.date_from = _.isDate(date_from) ? date_from.toString() : date_from;
    }

    const { body } = await this.makeRequest<{}, IGetOrdersListQueryParams, TGetOrdersListResponse>(
      HttpMethods.Get,
      this.buildUrl('list'),
      {},
      queryParams,
    );

    return body;
  }

  public async getOrderById(orderId: number): Promise<TGetOrderByIdResponse> {
    const { body } = await this.makeRequest<{}, {}, TGetOrderByIdResponse>(
      HttpMethods.Get,
      this.buildUrl(orderId),
      {},
      {},
    );

    return body;
  }

  public async setOrdersStatus(data: TPostOrdersSetStatusBody): Promise<TPostOrdersSetStatusResponse> {
    const { body } = await this.makeRequest<TPostOrdersSetStatusBody, {}, TPostOrdersSetStatusResponse>(
      HttpMethods.Post,
      this.buildUrl('set_status'),
      data,
      {},
    );

    return body;
  }

  public async refundOrders(data: IPostOrdersRefundBody): Promise<TPostOrdersRefundResponse> {
    const { body } = await this.makeRequest<IPostOrdersRefundBody, {}, TPostOrdersRefundResponse>(
      HttpMethods.Post,
      this.buildUrl('refund'),
      data,
      {},
    );

    return body;
  }

  public static readonly BASE_PATH = 'orders';
}
