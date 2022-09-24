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
import { ProductSale, ProductSaleModel } from '@schemas/productSale';
import { SyncPromService } from '../../sync/prom/sync-prom.service';
import { SearchProductBookingsDto } from './dto/search-product-bookings.dto';

@Injectable()
export class CrmProductBookingsService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    protected botService: CrmBotService,
    protected notificationBotService: NotificationBotService,
    private syncPromService: SyncPromService,
    @InjectModel(Product.name)
    private productModel: ProductModel,
    @InjectModel(ProductBooking.name)
    private productBookingModel: ProductBookingModel,
    @InjectModel(ProductSale.name)
    private productSaleModel: ProductSaleModel,
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

  private async getProductBookingSalesUser(
    productBooking: Pick<ProductBooking, 'history'>,
  ) {
    const salesId = productBooking.history[0].byUser;
    const sales = await this.userModel.findById(salesId).exec();
    if (!sales) {
      throw new HttpException('Sales user not found', HttpStatus.NOT_FOUND);
    }

    return sales;
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

    this.logger.debug('Notify Provider User:', {
      name: provider.name,
      role: provider.role,
      telegramId: provider.telegramId,
    });

    await this.notificationBotService.send({
      to: String(provider.telegramId),
      title: 'Запрос Бронирования',
      buttons: [['Подтвердить / Отклонить бронирование', url]],
      details,
    });
  }

  private async notifySales(
    {
      userTelegramId,
      productBookingStatus,
      productBookingId,
      productSaleId,
    }: {
      userTelegramId: UserDocument['telegramId'];
      productBookingStatus: ProductBookingStatus;
      productBookingId: string;
      productSaleId?: string;
    },
    details: Array<TArray.Pair<string, string | number>>,
  ) {
    const sales = await this.userModel.getByTelegram(userTelegramId);
    const bookingUrl = await this.botService.buildLoginURL(
      sales.telegramId,
      `/booking/${productBookingId}`,
    );

    this.logger.debug('Notify Sales User:', {
      name: sales.name,
      role: sales.role,
      telegramId: sales.telegramId,
    });

    let title: string;
    const buttons = [];
    if (productBookingStatus === ProductBookingStatus.Approve) {
      title = 'Подтверждение';

      const saleUrl = bookingUrl.replace(
        `/booking/${productBookingId}`,
        `/sale/${productSaleId}`,
      );

      buttons.push(['Просмотреть Бронирование', bookingUrl]);
      buttons.push(['Просмотреть Продажу', saleUrl]);
    } else {
      title = 'Отказ';

      buttons.push(['Просмотреть', bookingUrl]);
    }

    await this.notificationBotService.send({
      to: String(sales.telegramId),
      title: `${title} Бронирования`,
      buttons,
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

  public async search({ limit, offset, ...data }: SearchProductBookingsDto) {
    this.logger.debug('Find Product Bookings:', {
      limit,
      offset,
      data,
    });

    const productBookings = await this.productBookingModel.findBookings(data, {
      limit,
      offset,
    });

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
      count: data.count,
      description: data.description,
      product: {
        id: product._id,
        name: product.name,
        microtronId: product.microtronId,
      },
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

      const updatedProduct = await this.productModel.updateProduct(
        product._id,
        {
          quantity: product.quantity - productBooking.count,
          'sync.prom': false,
        },
        session,
      );

      const updateInPromResult =
        await this.syncPromService.syncProductsWithProm(
          [updatedProduct],
          session,
        );
      this.logger.debug('Sync Prom Result:', {
        ...updateInPromResult,
        updatedProducts: updateInPromResult.updatedProducts.length,
      });

      await this.notifyProvider(
        productBooking._id.toString(),
        Object.entries({
          'Имя продукта': MarkdownHelper.escape(product.name),
          'Код продукта': MarkdownHelper.monospaced(
            String(product.microtronId),
          ),
          Колличество: data.count,
          Сведения: MarkdownHelper.escape(data.description),
          Продавец: currentUser.name,
          'Время бронирования': _.get(
            productBooking,
            'createdAt',
          ).toLocaleString(),
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

    this.logger.debug('Approve Product Booking:', {
      rawPrice: data.rawPrice,
      product: {
        id: productBooking.product._id,
        name: productBooking.product.name,
        microtronId: productBooking.product.microtronId,
      },
      user: {
        name: currentUser.name,
        role: currentUser.role,
      },
    });

    return await this.withTransaction(async (session) => {
      const sales = await this.getProductBookingSalesUser(productBooking);

      const updatedProductBooking =
        await this.productBookingModel.updateBooking(
          productBooking._id,
          {
            status: ProductBookingStatus.Approve,
            rawPrice: data.rawPrice,
            byUser: currentUser._id,
          },
          session,
        );

      const productSale = await this.productSaleModel.addSale(
        {
          productBooking: updatedProductBooking,
          count: productBooking.count,
          product: productBooking.product,
          category: productBooking.category,
        },
        session,
      );

      await this.notifySales(
        {
          productBookingId: updatedProductBooking._id.toString(),
          productSaleId: productSale._id.toString(),
          productBookingStatus: updatedProductBooking.status,
          userTelegramId: sales.telegramId,
        },
        Object.entries({
          'Имя продукта': MarkdownHelper.monospaced(
            productBooking.product.name,
          ),
          'Код продукта': MarkdownHelper.monospaced(
            String(productBooking.product.microtronId),
          ),
          Колличество: updatedProductBooking.count,
          Сведения: MarkdownHelper.escape(updatedProductBooking.description),
          'Время бронирования': _.get(
            productBooking,
            'createdAt',
          ).toLocaleString(),
        }),
      );

      return {
        booking: updatedProductBooking,
        sale: productSale,
      };
    });
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
      disapproveReason: data.disapproveReason,
      product: {
        id: productBooking.product._id,
        name: productBooking.product.name,
        microtronId: productBooking.product.microtronId,
      },
      user: {
        name: currentUser.name,
        role: currentUser.role,
      },
    });

    const updatedProductBooking = await this.withTransaction(
      async (session) => {
        const sales = await this.getProductBookingSalesUser(productBooking);

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

        const updatedProduct = await this.productModel.updateProduct(
          productBooking.product._id,
          {
            quantity: productBooking.product.quantity + productBooking.count,
            'sync.prom': false,
          },
          session,
        );

        const updateInPromResult =
          await this.syncPromService.syncProductsWithProm(
            [updatedProduct],
            session,
          );
        this.logger.debug('Sync Prom Result:', {
          ...updateInPromResult,
          updatedProducts: updateInPromResult.updatedProducts.length,
        });

        await this.notifySales(
          {
            productBookingId: updatedProductBooking._id.toString(),
            productBookingStatus: updatedProductBooking.status,
            userTelegramId: sales.telegramId,
          },
          Object.entries({
            'Имя продукта': MarkdownHelper.monospaced(
              productBooking.product.name,
            ),
            'Код продукта': MarkdownHelper.monospaced(
              String(productBooking.product.microtronId),
            ),
            Причина: MarkdownHelper.escape(data.disapproveReason),
            'Время бронирования': _.get(
              productBooking,
              'createdAt',
            ).toLocaleString(),
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
