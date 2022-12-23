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
import {
  ReloadSheetConsumer,
  reloadSheetName,
  SyncProductsConsumer,
  syncProductsName,
  SyncPromOrdersConsumer,
  syncPromOrdersName,
} from './static/consumers';
import { JobBoardService } from './board/job-board.service';
import { SyncModule } from '../sync/sync.module';
import { JobStaticService } from './static/job-static.service';
import { TelegramModule } from '../telegram/telegram.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@schemas/user';
import { PromModule } from '../prom/prom.module';
import { MicrotronModule } from '../microtron/microtron.module';
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
const staticConsumers = [
  SyncProductsConsumer,
  SyncPromOrdersConsumer,
  ReloadSheetConsumer,
];

const allConsumers = [...consumers, ...staticConsumers];

const buildDefaultJobOptions = (
  timeout: number,
  [removeOnComplete = 2, removeOnFail = 2] = [],
) => ({
  attempts: 1,
  timeout,
  removeOnFail,
  removeOnComplete,
});

@Global()
@Module({
  imports: [
    SyncModule,
    TelegramModule,
    PromModule,
    MicrotronModule,
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
    // BASIC - DEV TEST
    BullModule.registerQueue({
      name: audioProcessorName,
      defaultJobOptions: buildDefaultJobOptions(ms('5s'), [1, 1]),
    }),
    BullModule.registerQueue({
      name: loadAllCategoriesName,
      defaultJobOptions: buildDefaultJobOptions(ms('10m')),
    }),
    BullModule.registerQueue({
      name: loadProductsByCategoryName,
      defaultJobOptions: buildDefaultJobOptions(ms('1h')),
    }),
    BullModule.registerQueue({
      name: loadAllProductsName,
      defaultJobOptions: buildDefaultJobOptions(ms('2h')),
    }),
    // BASIC - PROD
    BullModule.registerQueue({
      name: initLoadSheetName,
      defaultJobOptions: buildDefaultJobOptions(ms('2.5 hrs')),
    }),
    BullModule.registerQueue({
      name: syncCategoriesName,
      defaultJobOptions: buildDefaultJobOptions(ms('30m')),
    }),
    BullModule.registerQueue({
      name: syncCourseName,
      defaultJobOptions: buildDefaultJobOptions(ms('20m')),
    }),
    BullModule.registerQueue({
      name: syncProductsByCategoryName,
      defaultJobOptions: buildDefaultJobOptions(ms('1h')),
    }),
    // STATIC
    BullModule.registerQueue({
      name: syncProductsName,
      settings: {
        lockDuration: ms('20m'),
        maxStalledCount: 0,
      },
      defaultJobOptions: {
        ...buildDefaultJobOptions(ms('20m'), [4, 4]),
        // attempts: 2,
        // timeout: ms('10m'),
        // removeOnFail: 8,
        // removeOnComplete: 16,
        // repeat: {
        //   cron: '*/15 7-22 * * *', // At every 30th minute past every hour from 7 through 22.
        // },
        // backoff: {
        //   type: 'fixed',
        //   delay: ms('2m'),
        // },
      },
    }),
    BullModule.registerQueue({
      name: syncPromOrdersName,
      settings: {
        lockDuration: ms('10m'),
        maxStalledCount: 0,
      },
      defaultJobOptions: {
        attempts: 2,
        timeout: ms('10m'),
        removeOnFail: 4,
        removeOnComplete: 2,
        repeat: {
          cron: '*/15 3-23 * * *', // At every 15th minute past every hour from 3 through 23.
        },
        backoff: {
          type: 'fixed',
          delay: ms('2m'),
        },
      },
    }),
    BullModule.registerQueue({
      name: reloadSheetName,
      settings: {
        lockDuration: ms('1h'),
        maxStalledCount: 0,
      },
      defaultJobOptions: {
        attempts: 2,
        timeout: ms('2h'),
        removeOnFail: 4,
        removeOnComplete: 6,
        repeat: {
          cron: '0 4 * * 1-6', // At 04:00 on every day-of-week from Monday through Saturday
        },
        backoff: {
          type: 'fixed',
          delay: ms('10m'),
        },
      },
    }),
  ],
  providers: [...allConsumers, JobBoardService, JobStaticService],
  exports: [BullModule, JobBoardService, ...allConsumers],
})
export class JobModule implements NestModule {
  constructor(private readonly jobBoardService: JobBoardService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(this.jobBoardService.getRouter())
      .forRoutes(this.jobBoardService.getBasePath());
  }
}
