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
import { PromProductsService } from '../../prom/products/products.service';

export type TInitLoadSheetProcessorData = void;
export type TInitLoadSheetProcessorQueue = Queue<TInitLoadSheetProcessorData>;

export const initLoadSheetName = 'init-load-sheet' as const;

@Processor(initLoadSheetName)
export class InitLoadSheetConsumer {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly syncLocalService: SyncLocalService,
    private readonly syncPromService: SyncPromService,
    private readonly promProductsService: PromProductsService,
    private readonly notificationBotService: NotificationBotService,
    @InjectModel(User.name) private userModel: UserModel,
  ) {}

  private getReadableQueueName() {
    return initLoadSheetName
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
  async initLoadSheet(job: Job<TInitLoadSheetProcessorData>) {
    // START
    await this.unionLogger(job, 'Start init load sheet');

    // 1. Load all categories to DB
    await this.unionLogger(job, '1. Load all categories to DB');

    const loadedCategories =
      await this.syncLocalService.loadAllCategoriesToDB();

    await this.unionLogger(job, '1. Load all categories to DB result:', {
      loadedCategoriesCount: loadedCategories.length,
    });

    // 2. Load all products to DB
    await this.unionLogger(job, '2. Load all products to DB');

    const loadedProducts = await this.syncLocalService.loadAllProductsToDB();

    await this.unionLogger(job, '2. Load all products to DB result:', {
      loadedProductsCount: loadedProducts.length,
    });

    // 3. Load all categories to Google Sheet
    await this.unionLogger(job, '3. Load all categories to Google Sheet');

    const loadCategoriesToSheetResult =
      await this.syncPromService.loadAllCategoriesToSheet();

    await this.unionLogger(
      job,
      '3. Load all categories to Google Sheet result:',
      loadCategoriesToSheetResult,
    );

    // 4. Load all products to Google Sheet
    await this.unionLogger(job, '4. Load all products to Google Sheet');

    const loadProductsToSheetResult =
      await this.syncPromService.loadAllProductsToSheet();

    await this.unionLogger(
      job,
      '4. Load all products to Google Sheet result:',
      loadProductsToSheetResult,
    );

    // 5. Prom import Google Sheet
    await this.unionLogger(job, '5. Prom import Google Sheet');

    const promImportSheetResult = await this.promProductsService.importSheet();

    await this.unionLogger(
      job,
      '5. Prom import Google Sheet result:',
      promImportSheetResult,
    );

    // 6. Build result
    await this.unionLogger(job, '6. Build result');

    const result = {
      loadAllCategoriesToDB: {
        loadedCategories: loadedCategories.length,
      },
      loadAllProductsToDB: {
        loadedProducts: loadedProducts.length,
      },
      loadAllCategoriesToSheet: loadCategoriesToSheetResult,
      loadProductsToSheetResult: loadProductsToSheetResult,
      importSheet: promImportSheetResult,
    };

    // 7. Notify
    await this.unionLogger(job, '7. Notify Admin');

    await this.notifyAdmin(this.getReadableQueueName(), result);

    // END
    await this.unionLogger(job, 'Complete init load sheet');

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
