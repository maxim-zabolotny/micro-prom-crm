import { Module } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { CrmCategoriesController } from './categories/categories.controller';
import { CrmCategoriesService } from './categories/categories.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from '@schemas/category';
import { DataGenerateHelper } from '@common/helpers';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Category.name,
        schema: CategorySchema,
      },
    ]),
  ],
  controllers: [CrmController, CrmCategoriesController],
  providers: [DataGenerateHelper, CrmService, CrmCategoriesService],
  exports: [CrmService, CrmCategoriesService],
})
export class CrmModule {}
