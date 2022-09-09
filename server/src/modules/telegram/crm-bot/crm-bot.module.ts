import { Module } from '@nestjs/common';
import { CrmBotUpdate } from './crm-bot.update';
import { CrmBotService } from './crm-bot.service';
import { AuthModule } from '../../auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@schemas/user';
import { NotificationBotService } from './notification/notification.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  providers: [CrmBotService, CrmBotUpdate, NotificationBotService],
  exports: [CrmBotService, NotificationBotService],
})
export class CrmBotModule {}
