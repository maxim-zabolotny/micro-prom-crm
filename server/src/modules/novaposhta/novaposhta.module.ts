import { Module } from '@nestjs/common';
import { NovaposhtaService } from './novaposhta.service';
import { NovaposhtaController } from './novaposhta.controller';
import { NovaposhtaOrdersController } from './orders/orders.controller';
import { NovaposhtaOrdersService } from './orders/orders.service';

@Module({
  imports: [],
  controllers: [NovaposhtaController, NovaposhtaOrdersController],
  providers: [NovaposhtaService, NovaposhtaOrdersService],
  exports: [NovaposhtaOrdersService],
})
export class NovaposhtaModule {}
