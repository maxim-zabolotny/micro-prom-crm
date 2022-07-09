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
import { TelegrafModule } from 'nestjs-telegraf';

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
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: function (configService: ConfigService) {
        return {
          token: configService.get('tokens.telegram'),
        };
      },
    }),
    MicrotronModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(cors(), LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
