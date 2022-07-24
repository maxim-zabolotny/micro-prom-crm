/*external modules*/
import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { AudioConsumer, audioProcessorName } from './consumers';
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
  providers: consumers,
  exports: [BullModule, ...consumers],
})
export class JobModule {}
