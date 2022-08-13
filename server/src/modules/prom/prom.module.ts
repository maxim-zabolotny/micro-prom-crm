import { Module } from '@nestjs/common';
import { PromController } from './prom.controller';
import { PromService } from './prom.service';

@Module({
  imports: [],
  controllers: [PromController],
  providers: [PromService],
  exports: [],
})
export class PromModule {}
