/*external modules*/
import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import {
  AudioConsumer,
  audioProcessorName,
  LoadAllCategoriesConsumer,
  loadAllCategoriesName,
  LoadAllProductsConsumer,
  loadAllProductsName,
  LoadProductsByCategoryConsumer,
  loadProductsByCategoryName,
} from './consumers';
import { JobBoardService } from './board/job-board.service';
import { SyncModule } from '../sync/sync.module';
/*modules*/
/*services*/
/*controllers*/
/*consumers*/

const consumers = [
  AudioConsumer,
  LoadAllCategoriesConsumer,
  LoadProductsByCategoryConsumer,
  LoadAllProductsConsumer,
];

@Global()
@Module({
  imports: [
    SyncModule,
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        return {
          redis: {
            host: configService.get('redis.host'),
            port: configService.get('redis.port'),
          },
          prefix: `${configService.get('env')}:bull`,
          defaultJobOptions: {
            attempts: 3,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: audioProcessorName,
    }),
    BullModule.registerQueue({
      name: loadAllCategoriesName,
    }),
    BullModule.registerQueue({
      name: loadProductsByCategoryName,
    }),
    BullModule.registerQueue({
      name: loadAllProductsName,
    }),
  ],
  providers: [...consumers, JobBoardService],
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
