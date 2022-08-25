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
import { InjectModel } from '@nestjs/mongoose';
import { CommonSyncConsumer } from './CommonSync';

export type TSyncCategoriesProcessorData = void;
export type TSyncCategoriesProcessorQueue = Queue<TSyncCategoriesProcessorData>;

export const syncCategoriesName = 'sync-categories' as const;

@Processor(syncCategoriesName)
export class SyncCategoriesConsumer extends CommonSyncConsumer {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly queueName = syncCategoriesName;

  constructor(
    private readonly syncLocalService: SyncLocalService,
    private readonly syncPromService: SyncPromService,
    protected readonly notificationBotService: NotificationBotService,
    @InjectModel(User.name)
    protected readonly userModel: UserModel,
  ) {
    super(notificationBotService, userModel);
  }

  @Process()
  async syncCategories(job: Job<TSyncCategoriesProcessorData>) {
    // START
    await this.unionLogger(job, 'Start sync categories');

    // 1. Actualize
    await this.unionLogger(job, '1. Actualize categories');

    const {
      addedCategories,
      removedCategories,
      addedProducts,
      removedProducts,
    } = await this.syncLocalService.actualizeCategories();

    await this.unionLogger(job, '1. Actualize categories result:', {
      addedCategoriesCount: addedCategories.length,
      removedCategoriesCount: removedCategories.length,
      addedProductsCount: addedProducts.length,
      removedProductsCount: removedProducts.length,
    });

    // 2. Sync markup
    await this.unionLogger(job, '2. Sync markup');

    const { updatedCategories, updatedProducts } =
      await this.syncLocalService.syncMarkup();

    await this.unionLogger(job, '2. Sync markup result:', {
      updatedCategoriesCount: updatedCategories.length,
      updatedProductsCount: updatedProducts.length,
    });

    // 3. Prom
    const productsToUpdateInProm = _.filter(
      updatedProducts,
      (product) => product.sync.loaded,
    );
    const productsToRemoveFromProm = _.filter(
      removedProducts,
      (product) => product.sync.loaded,
    );

    await this.unionLogger(job, '3. Prom updates:', {
      productsToUpdateInPromCount: productsToUpdateInProm.length,
      productsToRemoveFromPromCount: productsToRemoveFromProm.length,
    });

    const updateInPromResult = await this.syncPromService.syncProductsWithProm(
      productsToUpdateInProm,
    );
    const removeProductsFromPromResult =
      await this.syncPromService.removeProductsFromProm(
        productsToRemoveFromProm,
      );

    await this.unionLogger(job, '3. Prom updates result:', {
      updateInPromResult,
      removeProductsFromPromResult,
    });

    // 4. Notify
    await this.unionLogger(job, '4. Notify Admin');

    await this.notifyAdmin(this.getReadableQueueName(), {
      actualizeCategories: {
        addedCategories: addedCategories.length,
        removedCategories: removedCategories.length,
        addedProducts: addedProducts.length,
        removedProducts: removedProducts.length,
      },
      syncMarkup: {
        updatedCategories: updatedCategories.length,
        updatedProducts: updatedProducts.length,
      },
      prom: {
        update: {
          processedIds: updateInPromResult.processedIds.length,
          unprocessedIds: updateInPromResult.unprocessedIds.length,
          errors: Object.keys(updateInPromResult.errors).length,
          updatedProducts: updateInPromResult.updatedProducts.length,
        },
        delete: {
          processedIds: removeProductsFromPromResult.processedIds.length,
          unprocessedIds: removeProductsFromPromResult.unprocessedIds.length,
          errors: Object.keys(removeProductsFromPromResult.errors).length,
          productIds: removeProductsFromPromResult.productIds.length,
        },
      },
    });

    // 5. Result
    await this.unionLogger(job, '5. Build result');

    const result = {
      actualizeCategories: {
        addedCategories,
        removedCategories,
        addedProducts,
        removedProducts,
      },
      syncMarkup: {
        updatedCategories,
        updatedProducts,
      },
      prom: {
        update: updateInPromResult,
        delete: removeProductsFromPromResult,
      },
    };

    // END
    await this.unionLogger(job, 'Complete sync categories');

    return result;
  }

  @OnQueueActive()
  onActive(job: Job) {
    super.onActive(job);
  }

  @OnQueueCompleted()
  onComplete(job: Job, result: Record<string, unknown>) {
    super.onComplete(job, result);
  }

  @OnQueueFailed()
  async onFail(job: Job, err: Error) {
    await super.onFail(job, err);
  }
}
