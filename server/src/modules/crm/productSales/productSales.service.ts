import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as _ from 'lodash';
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
import { CancelProductSaleDto } from './dto/cancel-product-sale.dto';
import { Types as PromTypes } from '@lib/prom';
import { SetProductSalePaidDto } from './dto/set-product-sale-paid.dto';
import { NovaposhtaOrdersService } from '../../novaposhta/orders/orders.service';

@Injectable()
export class CrmProductSalesService {
  private readonly logger = new Logger(this.constructor.name);
  private readonly isDev: boolean;

  constructor(
    private configService: ConfigService,
    private botService: CrmBotService,
    private notificationBotService: NotificationBotService,
    private promOrdersService: PromOrdersService,
    private novaposhtaOrdersService: NovaposhtaOrdersService,
    @InjectModel(ProductSale.name)
    private productSaleModel: ProductSaleModel,
    @InjectModel(User.name)
    private userModel: UserModel,
    @InjectConnection()
    private connection: Connection,
  ) {
    this.isDev = configService.get('isDev');
  }

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

  private async notifyProvider({
    productSaleId,
    productSaleStatus,
    details,
    photoURL,
    deliveryPrint,
    declarationId,
  }: {
    productSaleId: string;
    productSaleStatus: ProductSaleStatus;
    details: Array<TArray.Pair<string, string | number>>;
    photoURL?: string;
    deliveryPrint?: Buffer;
    declarationId?: string;
  }) {
    const provider = this.isDev
      ? await this.userModel.getAdmin()
      : await this.userModel.getProvider();

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
      case ProductSaleStatus.Delivering: {
        title = '?????????????? ??????????????????????';
        break;
      }
      case ProductSaleStatus.Sale: {
        title = '???????????????? ??????????????';
        break;
      }
      case ProductSaleStatus.Canceled: {
        title = '?????????? ???? ??????????????';
        break;
      }
      default: {
        throw new Error(`Invalid Product Sale status argument`);
      }
    }

    const mainMessage = await this.notificationBotService.send({
      to: String(provider.telegramId),
      photo: photoURL,
      buttons: [['?????????????????????? ??????????????', url]],
      title,
      details,
    });

    if (deliveryPrint) {
      await this.notificationBotService.send({
        title: 'TTH 100x100',
        to: String(provider.telegramId),
        fileBuffer: {
          content: deliveryPrint,
          name: `${declarationId}.pdf`,
        },
        replyToMessage: mainMessage.message_id,
      });
    }
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

  public async setProductSalePaid(data: SetProductSalePaidDto) {
    const productSale = await this.productSaleModel
      .findById(new Types.ObjectId(data.productSaleId))
      .exec();
    if (!productSale) {
      throw new HttpException('Product Sale not found', HttpStatus.NOT_FOUND);
    }

    if (
      [ProductSaleStatus.Sale, ProductSaleStatus.Canceled].includes(
        productSale.status,
      )
    ) {
      throw new HttpException(
        "Can't change paid status after Sale or Cancel",
        HttpStatus.FORBIDDEN,
      );
    }

    this.logger.debug('Set Product Sale Paid:', {
      productSaleId: data.productSaleId,
      paid: data.paid,
    });

    const updatedProductSale = await this.productSaleModel.setSalePaid(
      productSale._id,
      data.paid,
    );

    return updatedProductSale;
  }

  public async deliveryProductSale(data: DeliveryProductSaleDto) {
    const isNovaPoshtaDelivery =
      data.provider === PromTypes.DeliveryProvider.NovaPoshta;

    const productSale = await this.productSaleModel
      .findById(new Types.ObjectId(data.productSaleId))
      .exec();
    if (!productSale) {
      throw new HttpException('Product Sale not found', HttpStatus.NOT_FOUND);
    }

    if (isNovaPoshtaDelivery && _.isEmpty(data.declarationId)) {
      throw new HttpException(
        'Declaration Id is required for NovaPoshta',
        HttpStatus.BAD_REQUEST,
      );
    }

    // if (!productSale.promOrderId) {
    //   throw new HttpException(
    //     'You should set Prom Order Id before Delivering',
    //     HttpStatus.BAD_REQUEST,
    //   );
    // }

    let deliveryPrint: Buffer | undefined;
    if (isNovaPoshtaDelivery) {
      deliveryPrint = await this.novaposhtaOrdersService.getPDFPrintMaking(
        data.declarationId,
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

      if (
        updatedProductSale.promOrderId &&
        updatedProductSale.delivery.provider ===
          PromTypes.DeliveryProvider.NovaPoshta
      ) {
        await this.promOrdersService.setDeclaration({
          order_id: updatedProductSale.promOrderId,
          delivery_type: data.provider as PromTypes.DeliveryProvider.NovaPoshta,
          declaration_id: data.declarationId,
        });
      }

      if (isNovaPoshtaDelivery) {
        const product = updatedProductSale.product;
        await this.notifyProvider({
          productSaleId: updatedProductSale._id.toString(),
          productSaleStatus: updatedProductSale.status,
          details: Object.entries({
            '?????? ????????????????': MarkdownHelper.escape(product.name),
            '?????? ????????????????': MarkdownHelper.monospaced(
              String(product.microtronId),
            ),
            ??????????????????????: updatedProductSale.count,
            '?????????? ????????????????????': MarkdownHelper.monospaced(
              updatedProductSale.delivery.declarationId,
            ),
          }),
          photoURL: productSale.product.images[0],
          deliveryPrint: deliveryPrint,
          declarationId: updatedProductSale.delivery.declarationId,
        });
      }

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
      await this.notifyProvider({
        productSaleId: updatedProductSale._id.toString(),
        productSaleStatus: updatedProductSale.status,
        details: Object.entries({
          '?????? ????????????????': MarkdownHelper.escape(product.name),
          '?????? ????????????????': MarkdownHelper.monospaced(
            String(product.microtronId),
          ),
          ??????????????????????: updatedProductSale.count,
          '?????????? ????????': updatedProductSale.totalPrice,
          '?????????? ????????????': updatedProductSale.benefitPrice,
          '?????????? ??????????????': updatedProductSale.saleAt.toLocaleString(),
        }),
        photoURL: productSale.product.images[0],
      });

      return updatedProductSale;
    });
  }

  public async cancelProductSale(data: CancelProductSaleDto) {
    const productSale = await this.productSaleModel
      .findById(new Types.ObjectId(data.productSaleId))
      .exec();
    if (!productSale) {
      throw new HttpException('Product Sale not found', HttpStatus.NOT_FOUND);
    }

    this.logger.debug('Cancel Product Sale:', {
      productSaleId: productSale._id,
      canceledReason: data.canceledReason,
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
          status: ProductSaleStatus.Canceled,
          canceledAt: new Date(),
          canceledReason: data.canceledReason,
        },
        session,
      );

      const product = updatedProductSale.product;
      await this.notifyProvider({
        productSaleId: updatedProductSale._id.toString(),
        productSaleStatus: updatedProductSale.status,
        details: Object.entries({
          '?????? ????????????????': MarkdownHelper.escape(product.name),
          '?????? ????????????????': MarkdownHelper.monospaced(
            String(product.microtronId),
          ),
          ??????????????????????: updatedProductSale.count,
          '?????????????? ????????????': MarkdownHelper.escape(data.canceledReason),
          '?????????? ????????????': updatedProductSale.canceledAt.toLocaleString(),
        }),
        photoURL: productSale.product.images[0],
      });

      return updatedProductSale;
    });
  }
}
