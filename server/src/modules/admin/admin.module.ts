import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SyncModule } from '../sync/sync.module';
import { SyncLocalController } from './sync/sync-local.controller';
import { SyncPromController } from './sync/sync-prom.controller';
import { JobBoardController } from './job-board/job-board.controller';

@Module({
  imports: [SyncModule],
  controllers: [
    AdminController,
    SyncLocalController,
    SyncPromController,
    JobBoardController,
  ],
  providers: [AdminService],
})
export class AdminModule {}
