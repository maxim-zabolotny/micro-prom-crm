import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // INIT
  const app = await NestFactory.create(AppModule);

  // GET SERVICES
  const configService = app.get(ConfigService);

  // SET VALIDATION
  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: true, // EXPLAIN: should be one of "whitelist" or "forbidNonWhitelisted"
      forbidNonWhitelisted: true,
    }),
  );

  // START
  await app.listen(configService.get('port'));
}

bootstrap();
