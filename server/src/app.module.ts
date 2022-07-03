import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {MicrotronModule} from "./modules/microtron/microtron.module";
import configuration from "./config/configuration";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
    }),
    MicrotronModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
