import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { MicrotronModule } from '../microtron/microtron.module';
import { CrmModule } from '../crm/crm.module';
import { SyncPromService } from './prom/sync-prom.service';
import { SyncLocalService } from './local/sync-local.service';
import { DataUtilsHelper, TimeHelper } from '@common/helpers';
import { PromModule } from '../prom/prom.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Integration, IntegrationSchema } from '@schemas/integration';
import { Category, CategorySchema } from '@schemas/category';

@Module({
  imports: [
    MicrotronModule,
    PromModule,
    CrmModule,
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
  providers: [
    TimeHelper,
    DataUtilsHelper,
    SyncService,
    SyncLocalService,
    SyncPromService,
  ],
  exports: [SyncService, SyncLocalService, SyncPromService],
})
export class SyncModule {}
