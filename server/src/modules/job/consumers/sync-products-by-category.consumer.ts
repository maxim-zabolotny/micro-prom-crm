/*external modules*/
import * as _ from 'lodash';
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
import { NotificationBotService } from '../../telegram/crm-bot/notification/notification.service';
import { User, UserModel } from '@schemas/user';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CommonSyncConsumer } from './CommonSync';
import { Connection } from 'mongoose';

export type TSyncProductsByCategoryProcessorData = {
  categoryMicrotronId: string;
};
export type TSyncProductsByCategoryProcessorQueue =
  Queue<TSyncProductsByCategoryProcessorData>;

export const syncProductsByCategoryName = 'sync-products-by-category' as const;

@Processor(syncProductsByCategoryName)
export class SyncProductsByCategoryConsumer extends CommonSyncConsumer {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly queueName = syncProductsByCategoryName;

  constructor(
    private readonly syncLocalService: SyncLocalService,
    private readonly syncPromService: SyncPromService,
    protected readonly notificationBotService: NotificationBotService,
    @InjectModel(User.name)
    protected readonly userModel: UserModel,
    @InjectConnection()
    protected readonly connection: Connection,
  ) {
    super(notificationBotService, userModel, connection);
  }

  // syncProductsByCategory
  protected async main(
    job: Job<TSyncProductsByCategoryProcessorData>,
    session,
  ) {
    // START
    await this.unionLogger(job, 'Start sync products by category');

    // 1. Actualize
    await this.unionLogger(job, '1. Actualize products by category', job.data);

    const { added, updated, removed } =
      await this.syncLocalService.actualizeProductsByCategory(
        job.data.categoryMicrotronId,
        session,
      );

    await this.unionLogger(job, '1. Actualize products by category result:', {
      addedProductsCount: added.length,
      updatedProductsCount: updated.length,
      removedProductsCount: removed.length,
    });

    // 2. Prom
    const productsToUpdateInProm = _.filter(
      updated,
      (product) => product.sync.loaded,
    );

    const productsToRemoveFromProm = _.filter(
      removed,
      (product) => product.sync.loaded,
    );

    await this.unionLogger(job, '2. Prom updates:', {
      productsToUpdateInPromCount: productsToUpdateInProm.length,
      productsToRemoveFromPromCount: productsToRemoveFromProm.length,
    });

    const updateInPromResult = await this.syncPromService.syncProductsWithProm(
      productsToUpdateInProm,
      session,
    );

    const removeProductsFromPromResult =
      await this.syncPromService.removeProductsFromProm(
        _.map(productsToRemoveFromProm, '_id'),
      );

    await this.unionLogger(job, '2. Prom updates result:', {
      updateInPromResult: {
        ...updateInPromResult,
        updatedProducts: updateInPromResult.updatedProducts.length,
      },
      removeProductsFromPromResult: {
        ...removeProductsFromPromResult,
        productIds: removeProductsFromPromResult.productIds.length,
      },
    });

    // 3. Notify
    await this.unionLogger(job, '3. Notify Admin');

    await this.notifyAdmin(this.getReadableQueueName(), {
      actualizeProductsByCategory: {
        addedProductsCount: added.length,
        updatedProductsCount: updated.length,
        removedProductsCount: removed.length,
      },
      prom: {
        update: {
          processedIds: updateInPromResult.processedIds.length,
          unprocessedIds: updateInPromResult.unprocessedIds.length,
          errors: updateInPromResult.errors.length,
          updatedProducts: updateInPromResult.updatedProducts.length,
        },
        delete: {
          processedIds: removeProductsFromPromResult.processedIds.length,
          unprocessedIds: removeProductsFromPromResult.unprocessedIds.length,
          errors: removeProductsFromPromResult.errors.length,
          productIds: removeProductsFromPromResult.productIds.length,
        },
      },
    });

    // 4. Result
    await this.unionLogger(job, '4. Build result');

    const result = {
      actualizeProductsByCategory: {
        addedProducts: added,
        updatedProducts: updated,
        removedProducts: removed,
      },
      prom: {
        update: updateInPromResult,
        delete: removeProductsFromPromResult,
      },
    };

    // END
    await this.unionLogger(job, 'Complete sync products by category');

    return result;
  }

  @Process()
  protected async process(job: Job<TSyncProductsByCategoryProcessorData>) {
    return super.process(job);
  }

  @OnQueueActive()
  protected onActive(job) {
    super.onActive(job);
  }

  @OnQueueCompleted()
  protected onComplete(job, result) {
    super.onComplete(job, result);
  }

  @OnQueueFailed()
  protected async onFail(job, err) {
    await super.onFail(job, err);
  }
}
