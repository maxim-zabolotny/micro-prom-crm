import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { MicrotronModule } from '../microtron/microtron.module';
import { SyncPromService } from './prom/sync-prom.service';
import { SyncLocalService } from './local/sync-local.service';
import { DataUtilsHelper, TimeHelper } from '@common/helpers';
import { PromModule } from '../prom/prom.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Integration, IntegrationSchema } from '@schemas/integration';
import { Category, CategorySchema } from '@schemas/category';
import { Product, ProductSchema } from '@schemas/product';
import { SyncPromOrdersService } from './prom/sync-prom-orders.service';
import { PromOrder, PromOrderSchema } from '@schemas/promOrder';
import {Constant, ConstantSchema} from "@schemas/constant";

@Module({
  imports: [
    MicrotronModule,
    PromModule,
    MongooseModule.forFeature([
      {
        name: Integration.name,
        schema: IntegrationSchema,
      },
    ]),
    MongooseModule.forFeature([
      {
        name: Category.name,
        schema: CategorySchema,
      },
    ]),
    MongooseModule.forFeature([
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),
    MongooseModule.forFeature([
      {
        name: PromOrder.name,
        schema: PromOrderSchema,
      },
    ]),
    MongooseModule.forFeature([
      {
        name: Constant.name,
        schema: ConstantSchema,
      },
    ]),
  ],
  providers: [
    TimeHelper,
    DataUtilsHelper,
    SyncService,
    SyncLocalService,
    SyncPromService,
    SyncPromOrdersService,
  ],
  exports: [
    SyncService,
    SyncLocalService,
    SyncPromService,
    SyncPromOrdersService,
  ],
})
export class SyncModule {}
