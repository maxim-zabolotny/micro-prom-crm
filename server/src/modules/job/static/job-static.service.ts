import * as _ from 'lodash';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import {
  reloadSheetName,
  syncProductsName,
  TReloadSheetProcessorQueue,
  TSyncProductsProcessorQueue,
} from './consumers';

@Injectable()
export class JobStaticService implements OnModuleInit {
  private readonly logger = new Logger(this.constructor.name);

  private readonly staticQueues: Queue[] = [];

  constructor(
    private configService: ConfigService,
    @InjectQueue(syncProductsName)
    private syncProductsQueue: TSyncProductsProcessorQueue,
    @InjectQueue(reloadSheetName)
    private reloadSheetQueue: TReloadSheetProcessorQueue,
  ) {
    this.staticQueues.push(...[syncProductsQueue, reloadSheetQueue]);
  }

  async onModuleInit() {
    this.logger.log('Starting static jobs..');

    await this.reCreateRepeatableJobs();

    this.logger.log('Static jobs started');
  }

  public async removeAllNextJobs(staticQueue: Queue) {
    const allNextJobs = await staticQueue.getJobs([
      'waiting',
      'delayed',
      'paused',
    ]);
    const result = {
      waiting: 0,
      delayed: 0,
      paused: 0,
    };

    await Promise.all(
      _.map(allNextJobs, async (job) => {
        const status = await job.getState();
        result[status] = result[status] + 1;

        await job.remove();
      }),
    );

    return result;
  }

  public async reCreateRepeatableJobs() {
    await Promise.all(
      _.map(this.staticQueues, async (staticQueue) => {
        const readableQueueName = staticQueue.name
          .split('-')
          .map((k) => _.capitalize(k))
          .join(' ');

        try {
          const repeatableJobs = await staticQueue.getRepeatableJobs();

          if (repeatableJobs.length) {
            await Promise.all(
              _.map(repeatableJobs, (job) =>
                staticQueue.removeRepeatableByKey(job.key),
              ),
            );

            this.logger.debug(
              `"${readableQueueName}" repeatable jobs removed:`,
              {
                oldJobs: _.map(repeatableJobs, 'key'),
              },
            );
          }

          const result = await this.removeAllNextJobs(staticQueue);
          this.logger.debug(
            `"${readableQueueName}" next jobs removed:`,
            result,
          );

          await staticQueue.add({});
          this.logger.debug(`"${readableQueueName}" started`);
        } catch (err) {
          this.logger.error('Received error until recreate repeatable jobs:', {
            err,
            queueName: readableQueueName,
          });
        }
      }),
    );
  }
}
