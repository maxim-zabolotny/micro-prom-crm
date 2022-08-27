/*external modules*/
import * as ms from 'ms';
import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import {
  AudioConsumer,
  audioProcessorName,
  InitLoadSheetConsumer,
  initLoadSheetName,
  LoadAllCategoriesConsumer,
  loadAllCategoriesName,
  LoadAllProductsConsumer,
  loadAllProductsName,
  LoadProductsByCategoryConsumer,
  loadProductsByCategoryName,
  SyncCategoriesConsumer,
  syncCategoriesName,
  SyncCourseConsumer,
  syncCourseName,
  SyncProductsByCategoryConsumer,
  syncProductsByCategoryName,
} from './consumers';
import { JobBoardService } from './board/job-board.service';
import { SyncModule } from '../sync/sync.module';
import { JobStaticService } from './static/job-static.service';
import { TelegramModule } from '../telegram/telegram.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@schemas/user';
import { PromModule } from '../prom/prom.module';
/*modules*/
/*services*/
/*controllers*/
/*consumers*/

const consumers = [
  AudioConsumer,
  LoadAllCategoriesConsumer,
  LoadProductsByCategoryConsumer,
  LoadAllProductsConsumer,
  InitLoadSheetConsumer,
  SyncCategoriesConsumer,
  SyncCourseConsumer,
  SyncProductsByCategoryConsumer,
];

@Global()
@Module({
  imports: [
    SyncModule,
    TelegramModule,
    PromModule,
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        return {
          redis: {
            host: configService.get('redis.host'),
            port: configService.get('redis.port'),
          },
          prefix: `${configService.get('env')}:bull`,
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: audioProcessorName,
      defaultJobOptions: {
        attempts: 1,
        timeout: ms('5s'),
      },
    }),
    BullModule.registerQueue({
      name: loadAllCategoriesName,
      defaultJobOptions: {
        attempts: 1,
        timeout: ms('10m'),
        removeOnFail: false,
        removeOnComplete: false,
      },
    }),
    BullModule.registerQueue({
      name: loadProductsByCategoryName,
      defaultJobOptions: {
        attempts: 1,
        timeout: ms('1h'),
        removeOnFail: false,
        removeOnComplete: false,
      },
    }),
    BullModule.registerQueue({
      name: loadAllProductsName,
      defaultJobOptions: {
        attempts: 1,
        timeout: ms('2h'),
        removeOnFail: false,
        removeOnComplete: false,
      },
    }),
    BullModule.registerQueue({
      name: syncCategoriesName,
      defaultJobOptions: {
        attempts: 1,
        timeout: ms('1h'),
        removeOnFail: false,
        removeOnComplete: false,
      },
    }),
    BullModule.registerQueue({
      name: syncCourseName,
      defaultJobOptions: {
        attempts: 1,
        timeout: ms('10m'),
        removeOnFail: false,
        removeOnComplete: false,
      },
    }),
    BullModule.registerQueue({
      name: initLoadSheetName,
      defaultJobOptions: {
        attempts: 1,
        timeout: ms('2h'),
        removeOnFail: false,
        removeOnComplete: false,
      },
    }),
    BullModule.registerQueue({
      name: syncProductsByCategoryName,
      defaultJobOptions: {
        attempts: 1,
        timeout: ms('1h'),
        removeOnFail: false,
        removeOnComplete: false,
      },
    }),
  ],
  providers: [...consumers, JobBoardService, JobStaticService],
  exports: [BullModule, JobBoardService, ...consumers],
})
export class JobModule implements NestModule {
  constructor(private readonly jobBoardService: JobBoardService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(this.jobBoardService.getRouter())
      .forRoutes(this.jobBoardService.getBasePath());
  }
}
