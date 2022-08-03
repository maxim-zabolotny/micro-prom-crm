import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { MicrotronModule } from '../microtron/microtron.module';
import { CrmModule } from '../crm/crm.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Integration, IntegrationSchema } from '@schemas/integration';
import { SyncPromService } from './prom/sync-prom.service';
import { SyncLocalService } from './local/sync-local.service';

@Module({
  imports: [
    MicrotronModule,
    CrmModule,
    MongooseModule.forFeature([
      {
        name: Integration.name,
        schema: IntegrationSchema,
      },
    ]),
  ],
  controllers: [],
  providers: [SyncService, SyncLocalService, SyncPromService],
  exports: [SyncService, SyncLocalService, SyncPromService],
})
export class SyncModule {}
