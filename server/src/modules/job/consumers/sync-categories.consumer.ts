/*external modules*/
import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { Logger } from '@nestjs/common';

export type TSyncCategoriesProcessorData = void;
export type TSyncCategoriesProcessorQueue = Queue<TSyncCategoriesProcessorData>;

export const syncCategoriesName = 'sync-categories' as const;

@Processor(syncCategoriesName)
export class SyncCategoriesConsumer {
  private readonly logger = new Logger(this.constructor.name);

  constructor() {}

  private async unionLogger(
    job: Job,
    message: string,
    data: string | object = {},
  ) {
    this.logger.log(message, data);
    await job.log(
      `${message}: ${typeof data === 'object' ? JSON.stringify(data) : data}`,
    );
  }

  @Process()
  async syncCategories(job: Job<TSyncCategoriesProcessorData>) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(
      `Processing job ${job.id} of Queue ${job.queue.name} with data:`,
      job.data,
    );
  }

  @OnQueueCompleted()
  onComplete(job: Job, result: Record<string, unknown>) {
    this.logger.debug(
      `Job ${job.id} of Queue ${job.queue.name}: completed with result:`,
      result,
    );
  }

  @OnQueueFailed()
  onFail(job: Job, err: Error) {
    this.logger.debug(
      `Job ${job.id} of Queue ${job.queue.name} failed with error`,
      err,
    );
  }
}
