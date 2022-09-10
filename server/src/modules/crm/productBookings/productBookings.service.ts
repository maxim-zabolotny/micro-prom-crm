import * as _ from 'lodash';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  ProductBooking,
  ProductBookingModel,
  ProductBookingStatus,
} from '@schemas/productBooking';
import { CreateProductBookingDto } from './dto/create-product-booking.dto';
import { User, UserDocument, UserModel } from '@schemas/user';
import { Product, ProductModel } from '@schemas/product';
import { ClientSession, Connection, Types } from 'mongoose';
import { NotificationBotService } from '../../telegram/crm-bot/notification/notification.service';
import { TArray } from '@custom-types';
import { MarkdownHelper } from '../../telegram/common/helpers';
import { CrmBotService } from '../../telegram/crm-bot/crm-bot.service';
import { DisapproveProductBookingDto } from './dto/disapprove-product-booking.dto';
import { InjectQueue } from '@nestjs/bull';
import {
  syncProductsByCategoryName,
  TSyncProductsByCategoryProcessorQueue,
} from '../../job/consumers';
import { ApproveProductBookingDto } from './dto/approve-product-booking.dto';

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
    @InjectQueue(syncProductsByCategoryName)
    private syncProductsByCategoryQueue: TSyncProductsByCategoryProcessorQueue,
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

  private async notifySales(
    productBookingId: string,
    productBookingStatus: ProductBookingStatus,
    userTelegramId: UserDocument['telegramId'],
    details: Array<TArray.Pair<string, string | number>>,
  ) {
    const sales = await this.userModel.getByTelegram(userTelegramId);
    const url = await this.botService.buildLoginURL(
      sales.telegramId,
      `/booking/${productBookingId}`,
    );

    const title =
      productBookingStatus === ProductBookingStatus.Approve
        ? 'Подтверждение'
        : 'Отказ';
    await this.notificationBotService.send({
      to: String(sales.telegramId),
      title: `${title} Бронирования`,
      button: ['Просмотреть', url],
      details,
    });
  }

  public async getById(id: Types.ObjectId) {
    this.logger.debug('Get Product Booking by id:', { id });

    const productBooking = await this.productBookingModel.findById(id).exec();
    if (!productBooking) {
      throw new HttpException(
        'Product Booking not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return productBooking;
  }

  public async find(
    status: ProductBookingStatus,
    limit: number,
    offset: number,
  ) {
    this.logger.debug('Find Product Bookings:', { status, limit, offset });

    const productBookings = await this.productBookingModel.findBookings(
      {
        status,
      },
      {
        limit,
        offset,
      },
    );

    this.logger.debug('Found Product Bookings:', {
      count: productBookings.length,
    });

    return productBookings;
  }

  public async createProductBooking(
    data: CreateProductBookingDto,
    currentUser: UserDocument,
  ) {
    const product = await this.productModel
      .findById(new Types.ObjectId(data.productId))
      .exec();
    if (!product) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    if (data.count > product.quantity) {
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
      count: data.count,
      description: data.description,
      user: {
        name: currentUser.name,
        role: currentUser.role,
      },
    });

    return await this.withTransaction(async (session) => {
      const productBooking = await this.productBookingModel.addBooking(
        {
          ..._.omit(data, ['productId']),
          byUser: currentUser._id,
          product,
        },
        session,
      );

      await this.notifyProvider(
        productBooking._id.toString(),
        Object.entries({
          'Время бронирования': _.get(
            productBooking,
            'createdAt',
          ).toLocaleString(),
          'Имя продукта': product.name,
          'Код продукта': MarkdownHelper.monospaced(
            String(product.microtronId),
          ),
          Колличество: data.count,
          Сведения: data.description,
          Продавец: currentUser.name,
        }),
      );

      return productBooking;
    });
  }

  public async approveProductBooking(
    data: ApproveProductBookingDto,
    currentUser: UserDocument,
  ) {
    const productBooking =
      await this.productBookingModel.getWithProductAndCategory(
        new Types.ObjectId(data.productBookingId),
      );
    if (!productBooking) {
      throw new HttpException(
        'Product Booking not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  public async disapproveProductBooking(
    data: DisapproveProductBookingDto,
    currentUser: UserDocument,
  ) {
    const productBooking =
      await this.productBookingModel.getWithProductAndCategory(
        new Types.ObjectId(data.productBookingId),
      );
    if (!productBooking) {
      throw new HttpException(
        'Product Booking not found',
        HttpStatus.NOT_FOUND,
      );
    }

    this.logger.debug('Disapprove Product Booking:', {
      product: {
        id: productBooking.product._id,
        name: productBooking.product.name,
        microtronId: productBooking.product.microtronId,
      },
      disapproveReason: data.disapproveReason,
      user: {
        name: currentUser.name,
        role: currentUser.role,
      },
    });

    const updatedProductBooking = await this.withTransaction(
      async (session) => {
        const salesId = productBooking.history[0].byUser;
        const sales = await this.userModel
          .findById(salesId)
          .session(session)
          .exec();
        if (!sales) {
          throw new HttpException('Sales user not found', HttpStatus.NOT_FOUND);
        }

        const updatedProductBooking =
          await this.productBookingModel.updateBooking(
            productBooking._id,
            {
              status: ProductBookingStatus.Disapprove,
              disapproveReason: data.disapproveReason,
              byUser: currentUser._id,
            },
            session,
          );

        await this.notifySales(
          updatedProductBooking._id.toString(),
          updatedProductBooking.status,
          sales.telegramId,
          Object.entries({
            'Время бронирования': _.get(
              productBooking,
              'createdAt',
            ).toLocaleString(),
            'Имя продукта': MarkdownHelper.monospaced(
              productBooking.product.name,
            ),
            'Код продукта': MarkdownHelper.monospaced(
              String(productBooking.product.microtronId),
            ),
            Причина: data.disapproveReason,
          }),
        );

        return updatedProductBooking;
      },
    );

    const job = await this.syncProductsByCategoryQueue.add({
      categoryMicrotronId: productBooking.category.microtronId,
    });
    this.logger.debug('Add job sync-products-by-category', {
      id: job.id,
      name: job.queue.name,
      data: job.data,
    });

    return updatedProductBooking;
  }
}
