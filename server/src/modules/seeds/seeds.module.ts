import { Module } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';

import { UserSeed } from '../../database/seeds/user.seed';
import { ConstantSeed } from '../../database/seeds/constant.seed';
import { AuthModule } from '../auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@schemas/user';
import { Constant, ConstantSchema } from '@schemas/constant';
import { IntegrationSeed } from '../../database/seeds/integration.seed';
import { Integration, IntegrationSchema } from '@schemas/integration';

@Module({
  imports: [
    CommandModule,
    AuthModule,
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    MongooseModule.forFeature([
      {
        name: Constant.name,
        schema: ConstantSchema,
      },
    ]),
    MongooseModule.forFeature([
      {
        name: Integration.name,
        schema: IntegrationSchema,
      },
    ]),
  ],
  providers: [UserSeed, ConstantSeed, IntegrationSeed],
})
export class SeedsModule {}
