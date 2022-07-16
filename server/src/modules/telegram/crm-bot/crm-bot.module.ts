import { Module } from '@nestjs/common';
import { CrmBotUpdate } from './crm-bot.update';
import { CrmBotService } from './crm-bot.service';
import { AuthModule } from '../../auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@schemas/user';
import { ConfigModule } from '@nestjs/config';
import { NgrokModule } from '../../ngrok/ngrok.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    NgrokModule,
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  providers: [CrmBotService, CrmBotUpdate],
})
export class CrmBotModule {}
