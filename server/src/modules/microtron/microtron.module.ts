import { Module } from '@nestjs/common';
import { MicrotronController } from './microtron.controller';
import { MicrotronService } from './microtron.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Constant, ConstantSchema } from '@schemas/constant';
import { MicrotronCategoriesController } from './categories/categories.controller';
import { MicrotronProductsController } from './products/products.controller';
import { MicrotronCoursesController } from './courses/courses.controller';
import { MicrotronCategoriesService } from './categories/categories.service';
import { MicrotronProductsService } from './products/products.service';
import { MicrotronCoursesService } from './courses/courses.service';
import { DataUtilsHelper, TimeHelper } from '@common/helpers';
import { TranslateModule } from '../translate/translate.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Constant.name,
        schema: ConstantSchema,
      },
    ]),
    TranslateModule,
  ],
  controllers: [
    MicrotronController,
    MicrotronCategoriesController,
    MicrotronProductsController,
    MicrotronCoursesController,
  ],
  providers: [
    DataUtilsHelper,
    TimeHelper,
    MicrotronService,
    MicrotronCategoriesService,
    MicrotronProductsService,
    MicrotronCoursesService,
  ],
  exports: [
    MicrotronCategoriesService,
    MicrotronProductsService,
    MicrotronCoursesService,
  ],
})
export class MicrotronModule {}
