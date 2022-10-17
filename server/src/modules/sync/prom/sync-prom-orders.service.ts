import * as _ from 'lodash';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DataUtilsHelper, TimeHelper } from '@common/helpers';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductModel } from '@schemas/product';
import { PromOrdersService } from '../../prom/orders/orders.service';
import { MicrotronProductsService } from '../../microtron/products/products.service';
import {
  Product as LibMicrotronProduct,
  Types as MicrotronTypes,
} from '@lib/microtron';
import { Order as LibPromOrder } from '@lib/prom';
import { ClientSession } from 'mongodb';
import { MicrotronCoursesService } from '../../microtron/courses/courses.service';
import { GetOrdersListDto } from '../../prom/orders/dto/get-orders-list.dto';
import { Types } from 'mongoose';
import {
  PromOrder,
  PromOrderDocument,
  PromOrderModel,
} from '@schemas/promOrder';
import { TArray } from '@custom-types';
import { Category, CategoryModel } from '@schemas/category';
import { TUpdatePromOrderInDB } from '@schemas/promOrder/prom-order.schema';

export interface IChangePromOrdersActions {
  promOrdersToAdd: LibPromOrder.IOrder[];
  promOrdersToUpdate: Array<TArray.Pair<Types.ObjectId, TUpdatePromOrderInDB>>;
}

export interface ISyncPromOrdersResult {
  added: PromOrderDocument[];
  updated: PromOrderDocument[];
}

@Injectable()
export class SyncPromOrdersService implements OnModuleInit {
  private readonly logger = new Logger(this.constructor.name);

  private microtronProductsService: MicrotronProductsService;

  constructor(
    private configService: ConfigService,
    private promOrdersService: PromOrdersService,
    private microtronCoursesService: MicrotronCoursesService,
    private dataUtilsHelper: DataUtilsHelper,
    private timeHelper: TimeHelper,
    @InjectModel(Category.name)
    private categoryModel: CategoryModel,
    @InjectModel(Product.name)
    private productModel: ProductModel,
    @InjectModel(PromOrder.name)
    private promOrderModel: PromOrderModel,
    private moduleRef: ModuleRef,
  ) {}

  async onModuleInit() {
    this.microtronProductsService = await this.moduleRef.create(
      MicrotronProductsService,
    );

    this.microtronProductsService
      .setToken(this.configService.get('microtron.rawToken'))
      .setDefaultProductAPIOptions({ lang: MicrotronTypes.Lang.RU })
      .setValidProductConfig({
        checkMinPrice: (v) => v > 0,
        checkMinQuantity: (v) => v >= 0,
      });
  }

  // UTILITIES PART
  public async addPromOrdersToDB(
    promOrders: LibPromOrder.IOrder[],
    session?: ClientSession | null,
  ) {
    this.logger.debug('Start loading Prom Orders to DB', {
      count: promOrders.length,
    });

    const addedPromOrders: PromOrderDocument[] = [];
    for (const promOrder of promOrders) {
      const addedPromOrder = await this.promOrderModel.addOrder(
        promOrder,
        session,
      );
      addedPromOrders.push(addedPromOrder);
    }

    this.logger.debug('Loaded Prom Orders to DB:', {
      count: addedPromOrders.length,
    });

    return addedPromOrders;
  }

  public async updatePromOrdersInDB(
    promOrderWithData: IChangePromOrdersActions['promOrdersToUpdate'],
    session?: ClientSession | null,
  ) {
    this.logger.debug('Update Prom Orders in DB:', {
      ids: _.map(promOrderWithData, (promOrderData) => promOrderData[0]._id),
      count: promOrderWithData.length,
    });

    const updatedPromOrders: PromOrderDocument[] = [];
    for (const [promOrder, data] of promOrderWithData) {
      const updatedPromOrder = await this.promOrderModel.updateOrder(
        promOrder._id,
        data,
        session,
      );
      updatedPromOrders.push(updatedPromOrder);
    }

    this.logger.debug('Updated Prom Orders in DB:', {
      ids: _.map(updatedPromOrders, '_id'),
      count: updatedPromOrders.length,
    });

    return updatedPromOrders;
  }

  public async getNewMicrotronProductsByPromOrder(
    microtronProducts: LibMicrotronProduct.IProductFull[],
    promOrder: PromOrderDocument,
    session?: ClientSession | null,
  ) {
    this.logger.debug('Find new Microtron Products:', {
      orderId: promOrder._id,
      clientName: promOrder.order.clientName,
    });

    const productsToSearch = _.filter(
      promOrder.orderProducts,
      (orderProduct) => {
        return (
          Boolean(orderProduct.internalId) &&
          !_.find(
            promOrder.microtronProducts,
            (microtronProduct) =>
              microtronProduct.internalId.toString() ===
              orderProduct.internalId.toString(),
          )
        );
      },
    );

    this.logger.debug('Products to search:', {
      count: productsToSearch.length,
    });
    if (_.isEmpty(productsToSearch)) return [];

    const productsFromDB = await this.productModel
      .find({
        _id: { $in: _.map(productsToSearch, 'internalId') },
      })
      .session(session)
      .exec();

    this.logger.debug('Found Products in DB:', {
      count: productsFromDB.length,
    });
    if (_.isEmpty(productsFromDB)) return [];

    const { intersection } = this.dataUtilsHelper.getDiff(
      _.map(microtronProducts, (p) => Number(p.id)).filter(
        (id) => !Number.isNaN(id),
      ),
      _.map(productsFromDB, (p) => Number(p.microtronId)).filter(
        (id) => !Number.isNaN(id),
      ),
    );

    this.logger.debug(`Found new Microtron Products:`, {
      count: intersection.length,
    });
    if (_.isEmpty(intersection)) return [];

    const microtronProductsMap = new Map(
      _.map(microtronProducts, (product) => [product.id, product]),
    );
    const productFromDBMap = new Map(
      _.map(productsFromDB, (product) => [product.microtronId, product]),
    );

    const productsToSearchMap = new Map(
      _.map(productsToSearch, (product) => [
        product.internalId.toString(),
        product,
      ]),
    );

    const productsToAdd = await Promise.all(
      _.map(intersection, async (productMicrotronId) => {
        const microtronProduct = microtronProductsMap.get(productMicrotronId);
        const dbProduct = productFromDBMap.get(productMicrotronId);

        const promOrderProduct = productsToSearchMap.get(
          dbProduct._id.toString(),
        );

        const category = await this.categoryModel.getCategoryByMicrotronId(
          microtronProduct.categoryId,
          session,
        );

        const course =
          microtronProduct.currency === MicrotronTypes.Currency.UAH
            ? 1
            : category.course;

        const rawPrice = this.productModel.getProductPrice(microtronProduct);
        const price = rawPrice * course;

        return {
          externalId: microtronProduct.id,
          internalId: dbProduct._id,
          name: microtronProduct.name,
          hash: this.dataUtilsHelper.getSHA256(microtronProduct.name.trim()),
          currency: microtronProduct.currency,
          rawPrice: rawPrice,
          price: price,
          saleQuantity: promOrderProduct.quantity,
          url: microtronProduct.url,
          categoryId: microtronProduct.categoryId,
          categoryCourse: category.course,
          categoryMarkup: category.markup,
          internalCategoryId: category._id,
        };
      }),
    );

    this.logger.debug(`Generated Products to add:`, {
      count: productsToAdd.length,
    });

    return productsToAdd;
  }

  public async getChangePromOrderProductsActions(
    session?: ClientSession | null,
  ) {
    const result: IChangePromOrdersActions = {
      promOrdersToAdd: [],
      promOrdersToUpdate: [],
    };

    const microtronProducts = _.flattenDeep(
      Object.values(
        await this.microtronProductsService.getAllProductsBySavedCategories(
          true,
        ),
      ),
    );

    const incompletePromOrders = await this.promOrderModel.getIncompleteOrders(
      session,
    );
    if (_.isEmpty(incompletePromOrders)) {
      this.logger.debug(`Didn't find incomplete Prom Orders`);
      return result;
    }

    await Promise.all(
      _.map(incompletePromOrders, async (promOrder) => {
        const productsToAdd = await this.getNewMicrotronProductsByPromOrder(
          microtronProducts,
          promOrder,
          session,
        );
        if (_.isEmpty(productsToAdd)) return;

        result.promOrdersToUpdate.push([
          promOrder._id,
          {
            productsToAdd,
          },
        ]);
      }),
    );

    return result;
  }

  public async getChangePromOrdersActions(
    config: GetOrdersListDto,
    session?: ClientSession | null,
  ) {
    const result: IChangePromOrdersActions = {
      promOrdersToAdd: [],
      promOrdersToUpdate: [],
    };

    const promOrders = await this.promOrdersService.getOrdersList(config);
    const promOrdersMap = new Map(
      _.map(promOrders, (promOrder) => [promOrder.id, promOrder]),
    );

    const promOrdersFromDB = await this.promOrderModel.getAllOrders(session);
    const promOrdersFromDBMap = new Map(
      _.map(promOrdersFromDB, (promOrder) => [
        promOrder.order.externalId,
        promOrder,
      ]),
    );

    const { added: addedPromOrderIds, intersection: promOrderIds } =
      this.dataUtilsHelper.getDiff(
        _.map(promOrders, 'id'),
        _.map(promOrdersFromDB, (promOrder) => promOrder.order.externalId),
      );

    if (!_.isEmpty(addedPromOrderIds)) {
      result.promOrdersToAdd = _.map(addedPromOrderIds, (promOrderId) =>
        promOrdersMap.get(promOrderId),
      );

      this.logger.debug('Found Prom Orders to add to DB:', {
        count: result.promOrdersToAdd.length,
      });
    }

    if (!_.isEmpty(promOrderIds)) {
      this.logger.debug('Found intercepted Prom Orders between DB and Prom:', {
        count: promOrderIds.length,
      });

      result.promOrdersToUpdate = _.compact(
        _.map(promOrderIds, (orderId) => {
          const orderFromProm = promOrdersMap.get(orderId);
          const orderFromDB = promOrdersFromDBMap.get(orderId);

          const isEqual = _.isEqual(
            _.get(orderFromProm, ['status']),
            _.get(orderFromDB, ['order', 'status']),
          );
          if (isEqual) return null;

          return [
            orderFromDB._id,
            {
              ..._.pick(orderFromProm, ['status']),
            },
          ];
        }),
      );

      this.logger.debug('Found Prom Orders to update in DB:', {
        count: result.promOrdersToUpdate.length,
      });
    }

    return result;
  }

  public async makePromOrdersChangeActions(
    data: Partial<IChangePromOrdersActions>,
    session?: ClientSession | null,
  ) {
    const result: ISyncPromOrdersResult = {
      added: [],
      updated: [],
    };

    if (_.every(Object.values(data), (ids) => _.isEmpty(ids))) {
      this.logger.debug('Nothing for make Prom Orders changes');
      return result;
    }

    this.logger.debug('Sync prom Orders changes with DB:', {
      add: data.promOrdersToAdd.length,
      update: data.promOrdersToUpdate.length,
    });

    const { promOrdersToAdd, promOrdersToUpdate } = data;

    if (!_.isEmpty(promOrdersToAdd)) {
      result.added = await this.addPromOrdersToDB(promOrdersToAdd, session);
    }

    if (!_.isEmpty(promOrdersToUpdate)) {
      result.updated = await this.updatePromOrdersInDB(
        promOrdersToUpdate,
        session,
      );
    }

    return result;
  }

  // MAIN PART
  async syncPromOrders(session?: ClientSession | null) {
    const changePromOrdersActions = await this.getChangePromOrdersActions(
      { limit: 100 },
      session,
    );
    const mainResult = await this.makePromOrdersChangeActions(
      changePromOrdersActions,
      session,
    );

    const changePromOrderProductsActions =
      await this.getChangePromOrderProductsActions(session);
    const productsResult = await this.makePromOrdersChangeActions(
      changePromOrderProductsActions,
      session,
    );

    return {
      mainResult,
      productsResult,
    };
  }
}
