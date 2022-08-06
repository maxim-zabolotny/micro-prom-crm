import { Module } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { CrmCategoriesController } from './categories/categories.controller';
import { CrmCategoriesService } from './categories/categories.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from '@schemas/category';
import { DataGenerateHelper } from '@common/helpers';
import { Product, ProductSchema } from '@schemas/product';
import { CrmProductService } from './product/product.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Category.name,
        schema: CategorySchema,
      },
    ]),
    MongooseModule.forFeature([
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),
  ],
  controllers: [CrmController, CrmCategoriesController],
  providers: [
    DataGenerateHelper,
    CrmService,
    CrmCategoriesService,
    CrmProductService,
  ],
  exports: [CrmService, CrmCategoriesService, CrmProductService],
})
export class CrmModule {}
