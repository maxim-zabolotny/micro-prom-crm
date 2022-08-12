/*lib*/
import * as Client from './core/client';
import * as Delivery from './core/delivery';
import * as Group from './core/group';
import * as Order from './core/order';
import * as PaymentOption from './core/paymentOption';
import * as Product from './core/product';
import * as Request from './core/request';
/*types*/
import * as Types from './core/types/api';
/*errors*/
import * as LibErrors from './core/error';
/*other*/

export {
  Client,
  Delivery,
  Group,
  Order,
  PaymentOption,
  Product,

  Request,

  Types,

  LibErrors,
};

export default class PromAPI {
  public static Client = Client.Client;
  public static Delivery = Delivery.Delivery;
  public static Group = Group.Group;
  public static Order = Order.Order;
  public static PaymentOption = PaymentOption.PaymentOption;
  public static Product = Product.Product;

  public static Request = Request.Request;

  public static Types = Types;

  public static AxiosExtendedError = LibErrors.AxiosExtendedError;
  public static PromAPIError = LibErrors.PromAPIError;
}
