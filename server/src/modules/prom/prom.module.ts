import { Module } from '@nestjs/common';
import { PromController } from './prom.controller';
import { PromService } from './prom.service';
import { PromProductsController } from './products/products.controller';
import { PromProductsService } from './products/products.service';
import { PromClientsController } from './clients/clients.controller';
import { PromClientsService } from './clients/clients.service';
import { PromOrdersController } from './orders/orders.controller';
import { PromOrdersService } from './orders/orders.service';

@Module({
  imports: [],
  controllers: [
    PromController,
    PromProductsController,
    PromClientsController,
    PromOrdersController,
  ],
  providers: [
    PromService,
    PromProductsService,
    PromClientsService,
    PromOrdersService,
  ],
  exports: [PromProductsService, PromClientsService, PromOrdersService],
})
export class PromModule {}
