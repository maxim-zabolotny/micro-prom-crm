import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';

@Module({
  imports: [],
  controllers: [],
  providers: [SyncService],
})
export class SyncModule {}
