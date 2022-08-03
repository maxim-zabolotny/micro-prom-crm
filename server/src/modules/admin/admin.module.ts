import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SyncModule } from '../sync/sync.module';
import { SyncLocalController } from './sync/sync-local.controller';
import { SyncPromController } from './sync/sync-prom.controller';

@Module({
  imports: [SyncModule],
  controllers: [AdminController, SyncLocalController, SyncPromController],
  providers: [AdminService],
})
export class AdminModule {}
