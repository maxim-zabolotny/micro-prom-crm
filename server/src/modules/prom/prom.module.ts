import { Module } from '@nestjs/common';
import { PromController } from './prom.controller';
import { PromService } from './prom.service';
import { PromProductsController } from './products/products.controller';
import { PromProductsService } from './products/products.service';
import { PromClientsController } from './clients/clients.controller';
import { PromClientsService } from './clients/clients.service';

@Module({
  imports: [],
  controllers: [PromController, PromProductsController, PromClientsController],
  providers: [PromService, PromProductsService, PromClientsService],
  exports: [PromProductsService, PromClientsService],
})
export class PromModule {}
