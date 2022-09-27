import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SyncModule } from '../sync/sync.module';
import { SyncLocalController } from './sync/sync-local.controller';
import { SyncPromController } from './sync/sync-prom.controller';
import { JobBoardController } from './job-board/job-board.controller';
import { AdminLogService } from './log/log.service';
import { AdminLogController } from './log/log.controller';

@Module({
  imports: [SyncModule],
  controllers: [
    AdminController,
    AdminLogController,
    SyncLocalController,
    SyncPromController,
    JobBoardController,
  ],
  providers: [AdminService, AdminLogService],
})
export class AdminModule {}
