import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CrmModule } from './crm/crm.module';

@Module({
  imports: [
    CrmModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: function (configService: ConfigService) {
        this.botName = configService.get('telegram.botName');

        return {
          token: configService.get('telegram.token'),
          include: [CrmModule],
        };
      },
    }),
  ],
})
export class TelegramModule {}
