import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MicrotronModule } from './modules/microtron/microtron.module';
import configuration from './config/configuration';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
