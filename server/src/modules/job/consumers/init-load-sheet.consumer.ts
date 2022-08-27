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
import { NotificationBotService } from '../../telegram/crm-bot/notification/notification.service';
import { User, UserModel } from '@schemas/user';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { PromProductsService } from '../../prom/products/products.service';
import { CommonSyncConsumer } from './CommonSync';
import { Connection } from 'mongoose';
import { TSyncCourseProcessorData } from './sync-course.consumer';
import { ClientSession } from 'mongodb';

export type TInitLoadSheetProcessorData = void;
export type TInitLoadSheetProcessorQueue = Queue<TInitLoadSheetProcessorData>;

export const initLoadSheetName = 'init-load-sheet' as const;

@Processor(initLoadSheetName)
export class InitLoadSheetConsumer extends CommonSyncConsumer {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly queueName = initLoadSheetName;

  constructor(
    private readonly syncLocalService: SyncLocalService,
    private readonly syncPromService: SyncPromService,
    private readonly promProductsService: PromProductsService,
    protected readonly notificationBotService: NotificationBotService,
    @InjectModel(User.name)
    protected readonly userModel: UserModel,
    @InjectConnection()
    protected readonly connection: Connection,
  ) {
    super(notificationBotService, userModel, connection);
  }

  async initLoadSheet(
    job: Job<TInitLoadSheetProcessorData>,
    session: ClientSession,
  ) {
    // START
    await this.unionLogger(job, 'Start init load sheet');

    // 1. Load all categories to DB
    await this.unionLogger(job, '1. Load all categories to DB');

    const loadedCategories = await this.syncLocalService.loadAllCategoriesToDB(
      session,
    );

    await this.unionLogger(job, '1. Load all categories to DB result:', {
      loadedCategoriesCount: loadedCategories.length,
    });

    // 2. Load all products to DB
    await this.unionLogger(job, '2. Load all products to DB');

    const loadedProducts = await this.syncLocalService.loadAllProductsToDB(
      session,
    );

    await this.unionLogger(job, '2. Load all products to DB result:', {
      loadedProductsCount: loadedProducts.length,
    });

    // 3. Load all categories to Google Sheet
    await this.unionLogger(job, '3. Load all categories to Google Sheet');

    const loadCategoriesToSheetResult =
      await this.syncPromService.loadAllCategoriesToSheet(session);

    await this.unionLogger(
      job,
      '3. Load all categories to Google Sheet result:',
      loadCategoriesToSheetResult,
    );

    // 4. Load all products to Google Sheet
    await this.unionLogger(job, '4. Load all products to Google Sheet');

    const loadProductsToSheetResult =
      await this.syncPromService.loadAllProductsToSheet(session);

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

  @Process()
  protected async process(job: Job<TSyncCourseProcessorData>) {
    return this.withTransaction(job, async (session) => {
      return this.initLoadSheet(job, session);
    });
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
