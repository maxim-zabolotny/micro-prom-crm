import { Module } from '@nestjs/common';
import { MicrotronController } from './microtron.controller';
import { MicrotronService } from './microtron.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Constant,
  ConstantSchema,
} from '../../database/schemas/constant.schema';
import { CategoriesController } from './categories/categories.controller';
import { CategoriesService } from './categories/categories.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Constant.name,
        schema: ConstantSchema,
      },
    ]),
  ],
  controllers: [MicrotronController, CategoriesController],
  providers: [MicrotronService, CategoriesService],
})
export class MicrotronModule {}
