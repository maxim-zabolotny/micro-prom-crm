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

export type TSyncCourseProcessorData = void;
export type TSyncCourseProcessorQueue = Queue<TSyncCourseProcessorData>;

export const syncCourseName = 'sync-course' as const;

@Processor(syncCourseName)
export class SyncCourseConsumer {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly syncLocalService: SyncLocalService,
    private readonly syncPromService: SyncPromService,
    private readonly notificationBotService: NotificationBotService,
    @InjectModel(User.name) private userModel: UserModel,
  ) {}

  private getReadableQueueName() {
    return syncCourseName
      .split('-')
      .map((k) => _.capitalize(k))
      .join(' ');
  }

  private async unionLogger(
    job: Job,
    message: string,
    data: string | object = {},
  ) {
    this.logger.log(message, data);
    await job.log(
      `${message} ${typeof data === 'object' ? JSON.stringify(data) : data}`,
    );
  }

  private async notifyAdmin(title: string, obj: Record<string, unknown>) {
    const admin = await this.userModel.getAdmin();
    await this.notificationBotService.send({
      to: String(admin.telegramId),
      title: title,
      jsonObject: obj,
    });
  }

  @Process()
  async syncCourse(job: Job<TSyncCourseProcessorData>) {
    // START
    await this.unionLogger(job, 'Start sync course');

    // 1. Sync course
    await this.unionLogger(job, '1. Sync course');

    const { updatedCategories, updatedProducts } =
      await this.syncLocalService.syncCourse();

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
    );

    await this.unionLogger(job, '2. Prom updates result:', {
      updateInPromResult,
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
        updatedCategories,
        updatedProducts,
      },
      prom: {
        update: updateInPromResult,
      },
    };

    // END
    await this.unionLogger(job, 'Complete sync categories');

    return result;
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
  async onFail(job: Job, err: Error) {
    this.logger.debug(
      `Job ${job.id} of Queue ${job.queue.name} failed with error`,
      err,
    );

    await this.notifyAdmin(`FAIL: ${this.getReadableQueueName()}`, {
      name: err.name,
      message: err.message,
      stack: err.stack,
      cause: err.cause,
    });
  }
}
