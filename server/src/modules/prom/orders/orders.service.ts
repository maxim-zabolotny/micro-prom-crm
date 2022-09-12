import * as _ from 'lodash';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PromAPI, {
  Delivery as PromDelivery,
  Order as PromOrder,
} from '@lib/prom';
import { SearchOrdersDto } from './dto/search-orders.dto';
import { SetOrderDeliveryDto } from './dto/set-order-delivery.dto';

@Injectable()
export class PromOrdersService {
  private readonly logger = new Logger(this.constructor.name);

  private readonly ordersAPI: PromOrder.Order;
  private readonly deliveryAPI: PromDelivery.Delivery;

  constructor(private configService: ConfigService) {
    this.ordersAPI = new PromAPI.Order({
      token: configService.get('tokens.prom'),
    });
    this.deliveryAPI = new PromAPI.Delivery({
      token: configService.get('tokens.prom'),
    });
  }

  public async search(data: SearchOrdersDto) {
    this.logger.debug('Search orders by:', data);

    const startOfDay = new Date(new Date().setUTCHours(0, 0, 0, 0));
    const now = new Date(Date.now());

    const orders = _.flattenDeep(
      await Promise.all(
        _.map(
          [
            {
              limit: 15,
              date_from: startOfDay,
              date_to: now,
              status: PromOrder.OrderStatus.Pending,
            },
            {
              limit: 15,
              date_from: startOfDay,
              date_to: now,
              status: PromOrder.OrderStatus.Draft,
            },
          ],
          async (data) => {
            const { orders } = await this.ordersAPI.getList(data);
            return orders;
          },
        ),
      ),
    );

    const resultOrders = _.chain(orders)
      .filter((order) => {
        const conditions: boolean[] = [];

        if (data.id) {
          conditions.push(order.id === data.id);
        }

        if (data.clientName) {
          conditions.push(
            order.client_first_name?.includes(data.clientName) ||
              order.client_last_name?.includes(data.clientName),
          );
        }

        if (data.phone) {
          conditions.push(order.phone?.includes(data.phone));
        }

        if (data.email) {
          conditions.push(order.email?.includes(data.email));
        }

        if (data.price) {
          conditions.push(order.price && Number(order.price) >= data.price);
        }

        if (data.productId) {
          conditions.push(
            _.some(
              order.products,
              (product) => product?.external_id === data.productId,
            ),
          );
        }

        if (data.productName) {
          conditions.push(
            _.some(order.products, (product) =>
              product?.name.includes(data.productName),
            ),
          );
        }

        if (data.productQuantity) {
          conditions.push(
            _.some(
              order.products,
              (product) => product?.quantity === data.productQuantity,
            ),
          );
        }

        if (data.productPrice) {
          conditions.push(
            _.some(
              order.products,
              (product) =>
                product.price && Number(product.price) >= data.productPrice,
            ),
          );
        }

        if (data.productTotalPrice) {
          conditions.push(
            _.some(
              order.products,
              (product) =>
                product.total_price &&
                Number(product.total_price) >= data.productTotalPrice,
            ),
          );
        }

        if (data.productUrl) {
          conditions.push(
            _.some(order.products, (product) =>
              product?.url.includes(data.productUrl),
            ),
          );
        }

        return _.every(conditions, (result) => result === true);
      })
      .map((order) => {
        return {
          ..._.pick(order, [
            'id',
            'date_created',
            'client_first_name',
            'client_last_name',
            'phone',
            'email',
            'price',
            'status',
          ]),
          products: _.map(order.products, (product) =>
            _.pick(product, [
              'external_id',
              'name',
              'quantity',
              'price',
              'total_price',
              'url',
            ]),
          ),
        };
      })
      .value();

    this.logger.debug('Found orders:', {
      count: resultOrders.length,
    });

    return resultOrders;
  }

  public async setDeclaration(data: SetOrderDeliveryDto) {
    this.logger.debug('Set order delivery:', data);

    const result = await this.deliveryAPI.saveDeclaration(data);

    this.logger.debug('Set order delivery result:', data);

    return result;
  }
}
