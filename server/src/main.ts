import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

process.env.UV_THREADPOOL_SIZE = '8';

async function bootstrap() {
  // INIT
  const app = await NestFactory.create(AppModule);

  // GET SERVICES
  const configService = app.get(ConfigService);

  // SET VALIDATION
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // START
  await app.listen(configService.get('port'), () => {
    const logger = new Logger('App');
    logger.verbose(`Running on port: ${configService.get('port')}`);
  });
}

bootstrap();
