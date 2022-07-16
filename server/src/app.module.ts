import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import * as cors from 'cors';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MicrotronModule } from './modules/microtron/microtron.module';
import configuration from './config/configuration';
import { LoggerMiddleware } from '@common/middlewares';
import { TelegramModule } from './modules/telegram/telegram.module';
import { SeedsModule } from './modules/seeds/seeds.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: function (configService: ConfigService) {
        this.connectionName = configService.get('mongo.name');

        return {
          uri: configService.get('mongo.url'),
          retryAttempts: 3,
          retryDelay: 500,
        };
      },
    }),
    MicrotronModule,
    TelegramModule,
    SeedsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  constructor(private configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    const isDev = this.configService.get('isDev');
    const whitelist = this.configService.get('cors.whiteList');

    consumer
      .apply(
        cors({
          origin: function (origin, callback) {
            if (whitelist.includes(origin) || isDev) {
              callback(null, origin);
            } else {
              callback(new Error('Not allowed by CORS'));
            }
          },
        }),
        LoggerMiddleware,
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
