import { Request } from '../request';
import { IGetOrdersListQueryParams, IOrder, IOrderDeliveryOption, IOrderDeliveryProviderData, IOrderPaymentData, IOrderPaymentOption, IOrderProduct, IPostOrdersRefundBody, IPostOrdersSetStatusCanceledBody, IPostOrdersSetStatusDefaultBody, OrderCancellationReason, OrderSource, OrderStatus, PaymentStatus, PaymentType, TGetOrderByIdResponse, TGetOrdersListResponse, TPostOrdersRefundResponse, TPostOrdersSetStatusBody, TPostOrdersSetStatusResponse } from './IOrder';
export { OrderStatus, OrderSource, OrderCancellationReason, PaymentType, PaymentStatus, IOrderProduct, IOrderDeliveryOption, IOrderDeliveryProviderData, IOrderPaymentOption, IOrderPaymentData, IOrder, IGetOrdersListQueryParams, IPostOrdersSetStatusDefaultBody, IPostOrdersSetStatusCanceledBody, TPostOrdersSetStatusBody, IPostOrdersRefundBody, TGetOrdersListResponse, TGetOrderByIdResponse, TPostOrdersSetStatusResponse, TPostOrdersRefundResponse, };
export declare class Order extends Request {
    protected buildUrl(path: string | number): string;
    getList(params?: IGetOrdersListQueryParams): Promise<TGetOrdersListResponse>;
    getById(orderId: number): Promise<TGetOrderByIdResponse>;
    setStatus(data: TPostOrdersSetStatusBody): Promise<TPostOrdersSetStatusResponse>;
    refund(data: IPostOrdersRefundBody): Promise<TPostOrdersRefundResponse>;
    static readonly BASE_PATH = "orders";
}
