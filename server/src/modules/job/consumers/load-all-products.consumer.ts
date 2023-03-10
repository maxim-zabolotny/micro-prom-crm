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

export type TLoadAllProductsProcessorData = void;
export type TLoadAllProductsProcessorQueue =
  Queue<TLoadAllProductsProcessorData>;

export const loadAllProductsName = 'load-all-products' as const;

@Processor(loadAllProductsName)
export class LoadAllProductsConsumer {
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
  async loadAllProducts(job: Job<TLoadAllProductsProcessorData>) {
    await this.unionLogger(job, 'Start loading Products to DB');
    const loadedProducts = await this.syncLocalService.loadAllProductsToDB();

    await this.unionLogger(job, 'Start loading Products to Google Sheet');
    const { addedRowsCount, updatedProducts, newProductsCount, success } =
      await this.syncPromService.loadAllProductsToSheet();

    return {
      newProductsCount,
      addedRowsCount,
      updatedProductsCount: updatedProducts.length,
      loadedProductsCount: loadedProducts.length,
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
