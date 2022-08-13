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

export type TLoadProductsByCategoryProcessorData = { categoryId: string };
export type TLoadProductsByCategoryProcessorQueue =
  Queue<TLoadProductsByCategoryProcessorData>;

export const loadProductsByCategoryName = 'load-products-by-category' as const;

@Processor(loadProductsByCategoryName)
export class LoadProductsByCategoryConsumer {
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
  async loadProductsByCategory(job: Job<TLoadProductsByCategoryProcessorData>) {
    await this.unionLogger(job, 'Start loading products to DB');
    const loadedProducts =
      await this.syncLocalService.loadAllProductsByCategoryToDB(
        job.data.categoryId,
      );

    await this.unionLogger(job, 'Start loading products to Google Sheet');
    const { addedRowsCount, updatedProducts, newProductsCount, success } =
      await this.syncPromService.loadAllNewProductsByCategoryToSheet(
        job.data.categoryId,
      );

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
