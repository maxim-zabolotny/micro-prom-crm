import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { User, UserModel } from '@schemas/user';
import { ClientSession, Connection, Types } from 'mongoose';
import { NotificationBotService } from '../../telegram/crm-bot/notification/notification.service';
import { TArray } from '@custom-types';
import { CrmBotService } from '../../telegram/crm-bot/crm-bot.service';
import {
  ProductSale,
  ProductSaleModel,
  ProductSaleStatus,
} from '@schemas/productSale';
import { SetProductSaleDescriptionDto } from './dto/set-product-sale-description.dto';
import { SetProductSaleOrderDto } from './dto/set-product-sale-order.dto';
import { SetProductSaleClientDto } from './dto/set-product-sale-client.dto';
import { SearchProductSalesDto } from './dto/search-product-sales.dto';
import { DeliveryProductSaleDto } from './dto/delivery-product-sale.dto';
import { PromOrdersService } from '../../prom/orders/orders.service';
import { SaleProductSaleDto } from './dto/sale-product-sale.dto';
import { MarkdownHelper } from '../../telegram/common/helpers';

@Injectable()
export class CrmProductSalesService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    private botService: CrmBotService,
    private notificationBotService: NotificationBotService,
    private promOrdersService: PromOrdersService,
    @InjectModel(ProductSale.name)
    private productSaleModel: ProductSaleModel,
    @InjectModel(User.name)
    private userModel: UserModel,
    @InjectConnection()
    private connection: Connection,
  ) {}

  private async withTransaction<T>(cb: (session: ClientSession) => Promise<T>) {
    const session = await this.connection.startSession();

    try {
      let result: T;

      await session.withTransaction(async () => {
        result = await cb(session);
      });

      return result;
    } finally {
      await session.endSession();
    }
  }

  private async notifyProvider(
    productSaleId: string,
    productSaleStatus: ProductSaleStatus,
    details: Array<TArray.Pair<string, string | number>>,
  ) {
    const provider = await this.userModel.getAdmin(); // TODO: getProvider
    const url = await this.botService.buildLoginURL(
      provider.telegramId,
      `/sale/${productSaleId}`,
    );

    this.logger.debug('Notify Provider User:', {
      name: provider.name,
      role: provider.role,
      telegramId: provider.telegramId,
    });

    let title: string;
    switch (productSaleStatus) {
      case ProductSaleStatus.Sale: {
        title = 'Успешная Продажа';
        break;
      }
      case ProductSaleStatus.Canceled: {
        title = 'Отказ от Продажи';
        break;
      }
      default: {
        throw new Error(`Invalid Product Sale status argument`);
      }
    }

    await this.notificationBotService.send({
      to: String(provider.telegramId),
      buttons: [['Просмотреть продажу', url]],
      title,
      details,
    });
  }

  public async getById(id: Types.ObjectId) {
    this.logger.debug('Get Product Sale by id:', { id });

    const productBooking = await this.productSaleModel.findById(id).exec();
    if (!productBooking) {
      throw new HttpException('Product Sale not found', HttpStatus.NOT_FOUND);
    }

    return productBooking;
  }

  public async search({ limit, offset, ...data }: SearchProductSalesDto) {
    this.logger.debug('Find Product Sales:', {
      limit,
      offset,
      data,
    });

    const productBookings = await this.productSaleModel.findSales(data, {
      limit,
      offset,
    });

    this.logger.debug('Found Product Sales:', {
      count: productBookings.length,
    });

    return productBookings;
  }

  public async setProductSaleDescription(data: SetProductSaleDescriptionDto) {
    const productSale = await this.productSaleModel
      .findById(new Types.ObjectId(data.productSaleId))
      .exec();
    if (!productSale) {
      throw new HttpException('Product Sale not found', HttpStatus.NOT_FOUND);
    }

    this.logger.debug('Set Product Sale description:', {
      productSaleId: data.productSaleId,
      description: data.description,
    });

    const updatedProductSale = await this.productSaleModel.setSaleDescription(
      productSale._id,
      data.description,
    );

    return updatedProductSale;
  }

  public async setProductSaleOrder(data: SetProductSaleOrderDto) {
    const productSale = await this.productSaleModel
      .findById(new Types.ObjectId(data.productSaleId))
      .exec();
    if (!productSale) {
      throw new HttpException('Product Sale not found', HttpStatus.NOT_FOUND);
    }

    this.logger.debug('Set Product Sale Prom order:', {
      productSaleId: data.productSaleId,
      promOrderId: data.promOrderId,
    });

    const updatedProductSale = await this.productSaleModel.setSaleOrder(
      productSale._id,
      data.promOrderId,
    );

    return updatedProductSale;
  }

  public async setProductSaleClient(data: SetProductSaleClientDto) {
    const productSale = await this.productSaleModel
      .findById(new Types.ObjectId(data.productSaleId))
      .exec();
    if (!productSale) {
      throw new HttpException('Product Sale not found', HttpStatus.NOT_FOUND);
    }

    const client = {
      id: data.promClientId,
      name: data.promClientName,
      emails: data.promClientEmails,
      phones: data.promClientPhones,
    };

    this.logger.debug('Set Product Sale Prom client:', {
      productSaleId: data.productSaleId,
      client: client,
    });

    const updatedProductSale = await this.productSaleModel.setSaleClient(
      productSale._id,
      client,
    );

    return updatedProductSale;
  }

  public async deliveryProductSale(data: DeliveryProductSaleDto) {
    const productSale = await this.productSaleModel
      .findById(new Types.ObjectId(data.productSaleId))
      .exec();
    if (!productSale) {
      throw new HttpException('Product Sale not found', HttpStatus.NOT_FOUND);
    }

    if (!productSale.promOrderId) {
      throw new HttpException(
        'You should set Prom Order Id before Delivering',
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.debug('Delivery Product Sale:', {
      productSaleId: productSale._id,
      client: productSale.client,
      product: {
        id: productSale.product._id,
        name: productSale.product.name,
        microtronId: productSale.product.microtronId,
      },
    });

    return await this.withTransaction(async (session) => {
      const updatedProductSale = await this.productSaleModel.updateSale(
        productSale._id,
        {
          status: ProductSaleStatus.Delivering,
          provider: data.provider,
          declarationId: data.declarationId,
        },
        session,
      );

      await this.promOrdersService.setDeclaration({
        order_id: updatedProductSale.promOrderId,
        delivery_type: data.provider,
        declaration_id: data.declarationId,
      });

      return updatedProductSale;
    });
  }

  public async saleProductSale(data: SaleProductSaleDto) {
    const productSale = await this.productSaleModel
      .findById(new Types.ObjectId(data.productSaleId))
      .exec();
    if (!productSale) {
      throw new HttpException('Product Sale not found', HttpStatus.NOT_FOUND);
    }

    this.logger.debug('Sale Product Sale:', {
      productSaleId: productSale._id,
      saleAt: data.saleAt,
      client: productSale.client,
      product: {
        id: productSale.product._id,
        name: productSale.product.name,
        microtronId: productSale.product.microtronId,
      },
    });

    return await this.withTransaction(async (session) => {
      const updatedProductSale = await this.productSaleModel.updateSale(
        productSale._id,
        {
          status: ProductSaleStatus.Sale,
          saleAt: data.saleAt,
        },
        session,
      );

      const product = updatedProductSale.product;
      await this.notifyProvider(
        updatedProductSale._id.toString(),
        updatedProductSale.status,
        Object.entries({
          'Имя продукта': product.name,
          'Код продукта': MarkdownHelper.monospaced(
            String(product.microtronId),
          ),
          Колличество: updatedProductSale.count,
          'Общая цена': updatedProductSale.totalPrice,
          'Общая выгода': updatedProductSale.benefitPrice,
          'Время Продажи': updatedProductSale.saleAt.toLocaleString(),
        }),
      );

      return updatedProductSale;
    });
  }
}
