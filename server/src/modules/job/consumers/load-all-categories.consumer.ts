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
import { SyncLocalService } from '../../sync/local/sync-local.service';
import { SyncPromService } from '../../sync/prom/sync-prom.service';

export type TLoadAllCategoriesProcessorData = void;
export type TLoadAllCategoriesProcessorQueue =
  Queue<TLoadAllCategoriesProcessorData>;

export const loadAllCategoriesName = 'load-all-categories' as const;

@Processor(loadAllCategoriesName)
export class LoadAllCategoriesConsumer {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly syncLocalService: SyncLocalService,
    private readonly syncPromService: SyncPromService,
  ) {}

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
  async loadAllCategories(job: Job<TLoadAllCategoriesProcessorData>) {
    await this.unionLogger(job, 'Start loading categories to DB');
    const loadedCategories =
      await this.syncLocalService.loadAllCategoriesToDB();

    await this.unionLogger(job, 'Start loading categories to Google Sheet');
    const { addedRowsCount, updatedCategories, newCategoriesCount, success } =
      await this.syncPromService.loadAllNewCategoriesToSheet();

    return {
      newCategoriesCount,
      addedRowsCount,
      updatedCategoriesCount: updatedCategories.length,
      loadedCategoriesCount: loadedCategories.length,
      isLoadedToSheetOK: success,
    };
  }

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
