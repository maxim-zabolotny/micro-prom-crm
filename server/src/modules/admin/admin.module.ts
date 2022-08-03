import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SyncLocalController } from './sync-local/sync-local.controller';
import { SyncLocalService } from './sync-local/sync-local.service';
import { MicrotronModule } from '../microtron/microtron.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Integration, IntegrationSchema } from '@schemas/integration';
import { SyncPromController } from './sync-prom/sync-prom.controller';
import { SyncPromService } from './sync-prom/sync-prom.service';
import { CrmModule } from '../crm/crm.module';

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
  controllers: [AdminController, SyncLocalController, SyncPromController],
  providers: [AdminService, SyncLocalService, SyncPromService],
})
export class AdminModule {}
