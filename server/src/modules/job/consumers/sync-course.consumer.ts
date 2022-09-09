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

export type TSyncCourseProcessorData = void;
export type TSyncCourseProcessorQueue = Queue<TSyncCourseProcessorData>;

export const syncCourseName = 'sync-course' as const;

@Processor(syncCourseName)
export class SyncCourseConsumer extends CommonSyncConsumer {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly queueName = syncCourseName;

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

  // syncCourse
  protected async main(job: Job<TSyncCourseProcessorData>, session) {
    // START
    await this.unionLogger(job, 'Start sync course');

    // 1. Sync course
    await this.unionLogger(job, '1. Sync course');

    const { updatedCategories, updatedProducts } =
      await this.syncLocalService.syncCourse(session);

    await this.unionLogger(job, '1. Sync course result:', {
      updatedCategoriesCount: updatedCategories.length,
      updatedProductsCount: updatedProducts.length,
    });

    // 2. Prom
    const productsToUpdateInProm = _.filter(
      updatedProducts,
      (product) => product.sync.loaded,
    );

    await this.unionLogger(job, '2. Prom updates:', {
      productsToUpdateInPromCount: productsToUpdateInProm.length,
    });

    const updateInPromResult = await this.syncPromService.syncProductsWithProm(
      productsToUpdateInProm,
      session,
    );

    await this.unionLogger(job, '2. Prom updates result:', {
      updateInPromResult: {
        ...updateInPromResult,
        updatedProducts: updateInPromResult.updatedProducts.length,
      },
    });

    // 3. Notify
    await this.unionLogger(job, '3. Notify Admin');

    await this.notifyAdmin(this.getReadableQueueName(), {
      syncCourse: {
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
      },
    });

    // 4. Result
    await this.unionLogger(job, '4. Build result');

    const result = {
      syncCourse: {
        updatedCategories: updatedCategories.length,
        updatedProducts: updatedProducts.length,
      },
      prom: {
        update: updateInPromResult,
      },
    };

    // END
    await this.unionLogger(job, 'Complete sync course');

    return result;
  }

  @Process()
  protected async process(job: Job<TSyncCourseProcessorData>) {
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
