import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CrmBotModule } from './crm-bot/crm-bot.module';

@Module({
  imports: [
    CrmBotModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: function (configService: ConfigService) {
        this.botName = configService.get('telegram.botName');

        return {
          token: configService.get('telegram.token'),
          include: [CrmBotModule],
        };
      },
    }),
  ],
})
export class TelegramModule {}
