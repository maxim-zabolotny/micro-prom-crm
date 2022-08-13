import * as Client from './core/client';
import * as Delivery from './core/delivery';
import * as Group from './core/group';
import * as Order from './core/order';
import * as PaymentOption from './core/paymentOption';
import * as Product from './core/product';
import * as Request from './core/request';
import * as Types from './core/types/api';
import * as LibErrors from './core/error';
export { Client, Delivery, Group, Order, PaymentOption, Product, Request, Types, LibErrors, };
export default class PromAPI {
    static Client: typeof Client.Client;
    static Delivery: typeof Delivery.Delivery;
    static Group: typeof Group.Group;
    static Order: typeof Order.Order;
    static PaymentOption: typeof PaymentOption.PaymentOption;
    static Product: typeof Product.Product;
    static Request: typeof Request.Request;
    static Types: typeof Types;
    static AxiosExtendedError: typeof LibErrors.AxiosExtendedError;
    static PromAPIError: typeof LibErrors.PromAPIError;
}
