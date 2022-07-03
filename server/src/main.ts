import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {ConfigService} from "@nestjs/config";

async function bootstrap() {
  // INIT
  const app = await NestFactory.create(AppModule);

  // GET SERVICES
  const configService = app.get(ConfigService);

  console.log('configs => ', configService)

  // START
  await app.listen(configService.get('port'));
}

bootstrap();
