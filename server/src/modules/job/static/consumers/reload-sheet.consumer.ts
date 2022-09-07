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
import { SyncLocalService } from '../../../sync/local/sync-local.service';
import { SyncPromService } from '../../../sync/prom/sync-prom.service';
import { NotificationBotService } from '../../../telegram/crm-bot/notification/notification.service';
import { User, UserModel } from '@schemas/user';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CommonSyncConsumer } from '../../consumers/CommonSync';
import { Connection } from 'mongoose';
import { PromProductsService } from '../../../prom/products/products.service';

export type TReloadSheetProcessorData = void;
export type TReloadSheetQueue = Queue<TReloadSheetProcessorData>;

export const reloadSheetName = 'reload-sheet' as const;

@Processor(reloadSheetName)
export class ReloadSheetConsumer extends CommonSyncConsumer {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly queueName = reloadSheetName;

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

  // reloadSheet
  protected async main(job: Job<TReloadSheetProcessorData>, session) {
    // START
    await this.unionLogger(job, 'Start reload sheet');

    // 1. Actualize
    await this.unionLogger(job, '1. Actualize products');

    const { added, updated, removed } =
      await this.syncLocalService.actualizeAllProducts(session);

    await this.unionLogger(job, '1. Actualize products result:', {
      addedProductsCount: added.length,
      removedProductsCount: updated.length,
      updatedProductsCount: removed.length,
    });

    // 2. Sync course
    await this.unionLogger(job, '2. Sync course');

    const { updatedCategories, updatedProducts } =
      await this.syncLocalService.syncCourse(session);

    await this.unionLogger(job, '2. Sync course result:', {
      updatedCategoriesCount: updatedCategories.length,
      updatedProductsCount: updatedProducts.length,
    });

    // 3. Reload all categories to Google Sheet
    await this.unionLogger(job, '3. Reload all categories to Google Sheet');

    const reloadCategoriesToSheetResult =
      await this.syncPromService.reloadAllCategoriesToSheet(session);

    await this.unionLogger(
      job,
      '3. Reload all categories to Google Sheet result:',
      reloadCategoriesToSheetResult,
    );

    // 4. Reload all products to Google Sheet
    await this.unionLogger(job, '4. Reload all products to Google Sheet');

    const reloadProductsToSheetResult =
      await this.syncPromService.reloadAllProductsToSheet(session);

    await this.unionLogger(
      job,
      '4. Reload all products to Google Sheet result:',
      reloadProductsToSheetResult,
    );

    // 5. Prom import Google Sheet
    await this.unionLogger(job, '5. Prom import Google Sheet');

    const promImportSheetResult = await this.promProductsService.importSheet();

    await this.unionLogger(
      job,
      '5. Prom import Google Sheet result:',
      promImportSheetResult,
    );

    // 6. Notify
    await this.unionLogger(job, '6. Notify Admin');

    await this.notifyAdmin(this.getReadableQueueName(), {
      actualizeProducts: {
        addedProductsCount: added.length,
        removedProductsCount: updated.length,
        updatedProductsCount: removed.length,
      },
      syncCourse: {
        updatedCategories: updatedCategories.length,
        updatedProducts: updatedProducts.length,
      },
      reloadCategoriesToSheetResult: reloadCategoriesToSheetResult,
      reloadProductsToSheetResult: reloadProductsToSheetResult,
      importSheet: promImportSheetResult,
    });

    // 7. Result
    await this.unionLogger(job, '7. Build result');

    const result = {
      actualizeProducts: {
        addedProducts: added,
        updatedProducts: updated,
        removedProducts: removed,
      },
      syncCourse: {
        updatedCategories: updatedCategories.length,
        updatedProducts: updatedProducts.length,
      },
      reloadCategoriesToSheetResult: reloadCategoriesToSheetResult,
      reloadProductsToSheetResult: reloadProductsToSheetResult,
      importSheet: promImportSheetResult,
    };

    // END
    await this.unionLogger(job, 'Complete reload sheet');

    return result;
  }

  @Process()
  protected async process(job: Job<TReloadSheetProcessorData>) {
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
