import { Module } from '@nestjs/common';
import { MicrotronController } from './microtron.controller';
import { MicrotronService } from './microtron.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Constant, ConstantSchema } from '@schemas/constant';
import { CategoriesController } from './categories/categories.controller';
import { CategoriesService } from './categories/categories.service';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { DataUtilsHelper } from '@common/helpers';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Constant.name,
        schema: ConstantSchema,
      },
    ]),
  ],
  controllers: [MicrotronController, CategoriesController, ProductsController],
  providers: [
    MicrotronService,
    DataUtilsHelper,
    CategoriesService,
    ProductsService,
  ],
})
export class MicrotronModule {}
