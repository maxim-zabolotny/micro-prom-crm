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

@Injectable()
export class CrmProductSalesService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    protected botService: CrmBotService,
    protected notificationBotService: NotificationBotService,
    @InjectModel(ProductSale.name)
    private productSaleModel: ProductSaleModel,
    @InjectModel(User.name)
    protected userModel: UserModel,
    @InjectConnection()
    protected connection: Connection,
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
}
