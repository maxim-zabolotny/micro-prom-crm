import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { MicrotronModule } from '../microtron/microtron.module';
import { CrmModule } from '../crm/crm.module';
import { SyncPromService } from './prom/sync-prom.service';
import { SyncLocalService } from './local/sync-local.service';
import { DataUtilsHelper, TimeHelper } from '@common/helpers';
import { PromModule } from '../prom/prom.module';

@Module({
  imports: [MicrotronModule, PromModule, CrmModule],
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
