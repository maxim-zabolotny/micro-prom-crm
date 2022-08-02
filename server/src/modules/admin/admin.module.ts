import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SyncLocalController } from './sync-local/sync-local.controller';
import { SyncLocalService } from './sync-local/sync-local.service';
import { MicrotronModule } from '../microtron/microtron.module';
import {
  DataGenerateHelper,
  DataUtilsHelper,
  TimeHelper,
} from '@common/helpers';
import { MongooseModule } from '@nestjs/mongoose';
import { Constant, ConstantSchema } from '@schemas/constant';
import { Category, CategorySchema } from '@schemas/category';
import { Integration, IntegrationSchema } from '@schemas/integration';
import { SyncPromController } from './sync-prom/sync-prom.controller';
import { SyncPromService } from './sync-prom/sync-prom.service';

@Module({
  imports: [
    MicrotronModule,
    MongooseModule.forFeature([
      {
        name: Constant.name,
        schema: ConstantSchema,
      },
    ]),
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
  ],
  controllers: [AdminController, SyncLocalController, SyncPromController],
  providers: [
    DataUtilsHelper,
    DataGenerateHelper,
    TimeHelper,
    AdminService,
    SyncLocalService,
    SyncPromService,
  ],
})
export class AdminModule {}
