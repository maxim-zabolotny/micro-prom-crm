import { Module } from '@nestjs/common';
import { MicrotronController } from './microtron.controller';
import { MicrotronService } from './microtron.service';

@Module({
  imports: [],
  controllers: [MicrotronController],
  providers: [MicrotronService],
})
export class MicrotronModule {}
