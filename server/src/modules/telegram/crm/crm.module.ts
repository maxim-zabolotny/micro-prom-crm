import { Module } from '@nestjs/common';
import { CrmUpdate } from './crm.update';
import { RandomNumberScene } from './scenes/random-number.scene';
import { CrmService } from './crm.service';

@Module({
  providers: [CrmService, CrmUpdate, RandomNumberScene],
})
export class CrmModule {}
