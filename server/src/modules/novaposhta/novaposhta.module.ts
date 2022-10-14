import { Module } from '@nestjs/common';
import { NovaposhtaService } from './novaposhta.service';
import { NovaposhtaController } from './novaposhta.controller';

@Module({
  imports: [],
  controllers: [NovaposhtaController],
  providers: [NovaposhtaService],
  exports: [],
})
export class NovaposhtaModule {}
