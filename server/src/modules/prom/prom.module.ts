import { Module } from '@nestjs/common';
import { PromController } from './prom.controller';
import { PromService } from './prom.service';
import { PromProductsController } from './products/products.controller';
import { PromProductsService } from './products/products.service';

@Module({
  imports: [],
  controllers: [PromController, PromProductsController],
  providers: [PromService, PromProductsService],
  exports: [PromProductsService],
})
export class PromModule {}
