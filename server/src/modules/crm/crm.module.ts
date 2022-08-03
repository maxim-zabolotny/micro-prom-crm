import { Module } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { CrmCategoriesController } from './categories/categories.controller';
import { CrmCategoriesService } from './categories/categories.service';

@Module({
  imports: [],
  controllers: [CrmController, CrmCategoriesController],
  providers: [CrmService, CrmCategoriesService],
})
export class CrmModule {}
