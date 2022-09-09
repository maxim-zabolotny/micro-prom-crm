import * as _ from 'lodash';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ProductBooking, ProductBookingModel } from '@schemas/productBooking';
import { CreateProductBookingDto } from './dto/create-product-booking.dto';
import { User, UserDocument, UserModel } from '@schemas/user';
import { Product, ProductModel } from '@schemas/product';
import { ClientSession, Connection, Types } from 'mongoose';
import { NotificationBotService } from '../../telegram/crm-bot/notification/notification.service';
import { TArray } from '@custom-types';
import { MarkdownHelper } from '../../telegram/common/helpers';
import { CrmBotService } from '../../telegram/crm-bot/crm-bot.service';

@Injectable()
export class CrmProductBookingsService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    protected botService: CrmBotService,
    protected notificationBotService: NotificationBotService,
    @InjectModel(Product.name)
    private productModel: ProductModel,
    @InjectModel(ProductBooking.name)
    private productBookingModel: ProductBookingModel,
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
    productBookingId: string,
    details: Array<TArray.Pair<string, string | number>>,
  ) {
    const provider = await this.userModel.getAdmin(); // TODO: getProvider
    const url = await this.botService.buildLoginURL(
      provider.telegramId,
      `/booking/${productBookingId}`,
    );

    await this.notificationBotService.send({
      to: String(provider.telegramId),
      title: 'Запрос Бронирования',
      button: ['Подтвердить / Отклонить бронирование', url],
      details,
    });
  }

  public async createProductBooking(
    productBookingData: CreateProductBookingDto,
    currentUser: UserDocument,
  ) {
    const product = await this.productModel
      .findById(new Types.ObjectId(productBookingData.productId))
      .exec();
    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    if (productBookingData.count > product.quantity) {
      throw new HttpException(
        `Product haven't enough quantity`,
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.debug('Create Product Booking:', {
      product: {
        id: product._id,
        name: product.name,
        microtronId: product.microtronId,
      },
      count: productBookingData.count,
      description: productBookingData.description,
      user: {
        name: currentUser.name,
        role: currentUser.role,
      },
    });

    return await this.withTransaction(async (session) => {
      const productBooking = await this.productBookingModel.addBooking(
        {
          ..._.omit(productBookingData, ['productId']),
          byUser: currentUser._id,
          product,
        },
        session,
      );

      await this.notifyProvider(
        productBooking._id.toString(),
        Object.entries({
          'Имя продукта': product.name,
          'Код продукта': MarkdownHelper.monospaced(
            String(product.microtronId),
          ),
          Колличество: productBookingData.count,
          Сведения: productBookingData.description,
          Продавец: currentUser.name,
        }),
      );

      return productBooking;
    });
  }
}
