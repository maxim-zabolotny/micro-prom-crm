import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DataUtilsHelper, TimeHelper } from '@common/helpers';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductModel } from '@schemas/product';
import { PromOrdersService } from '../../prom/orders/orders.service';
import { MicrotronProductsService } from '../../microtron/products/products.service';
import { Types as MicrotronTypes } from '@lib/microtron';

@Injectable()
export class SyncPromOrdersService implements OnModuleInit {
  private readonly logger = new Logger(this.constructor.name);

  private microtronProductsService: MicrotronProductsService;

  constructor(
    private configService: ConfigService,
    private promOrdersService: PromOrdersService,
    private dataUtilsHelper: DataUtilsHelper,
    private timeHelper: TimeHelper,
    @InjectModel(Product.name)
    private productModel: ProductModel,
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
}
