import { Module } from '@nestjs/common';
import { MicrotronController } from './microtron.controller';
import { MicrotronService } from './microtron.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Constant,
  ConstantSchema,
} from '../../database/schemas/constant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Constant.name,
        schema: ConstantSchema,
      },
    ]),
  ],
  controllers: [MicrotronController],
  providers: [MicrotronService],
})
export class MicrotronModule {}
