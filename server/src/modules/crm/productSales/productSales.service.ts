import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { User, UserModel } from '@schemas/user';
import { ClientSession, Connection } from 'mongoose';
import { NotificationBotService } from '../../telegram/crm-bot/notification/notification.service';
import { TArray } from '@custom-types';
import { CrmBotService } from '../../telegram/crm-bot/crm-bot.service';
import {
  ProductSale,
  ProductSaleModel,
  ProductSaleStatus,
} from '@schemas/productSale';

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
}
