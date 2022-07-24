/*external modules*/
import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { AudioConsumer, audioProcessorName } from './consumers';
import { JobBoardService } from './board/job-board.service';
import { JobBoardController } from './board/job-board.controller';
/*modules*/
/*services*/
/*controllers*/
/*consumers*/

const consumers = [AudioConsumer];

@Global()
@Module({
  imports: [
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
    BullModule.registerQueue({ name: audioProcessorName }),
  ],
  controllers: [JobBoardController],
  providers: [...consumers, JobBoardService],
  exports: [BullModule, ...consumers],
})
export class JobModule implements NestModule {
  constructor(private readonly jobBoardService: JobBoardService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(this.jobBoardService.getRouter())
      .forRoutes(this.jobBoardService.getBasePath());
  }
}
