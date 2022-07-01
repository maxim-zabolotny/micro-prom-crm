import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// import microtron from '../../lib/dist/microtron/microtron.node.js';
// console.log('microtron => ', microtron)

import microtron from '@lib/microtron';
console.log('microtron => ', microtron)

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT);
}
bootstrap();
