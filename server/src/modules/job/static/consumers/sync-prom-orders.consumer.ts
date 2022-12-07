/*external modules*/
import {
  InjectQueue,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { Logger } from '@nestjs/common';
import { NotificationBotService } from '../../../telegram/crm-bot/notification/notification.service';
import { User, UserModel } from '@schemas/user';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CommonSyncConsumer } from '../../consumers/CommonSync';
import { Connection } from 'mongoose';
import { SyncPromOrdersService } from '../../../sync/prom/sync-prom-orders.service';
import {
  syncProductsName,
  TSyncProductsProcessorQueue,
} from './sync-products.consumer';

export type TSyncPromOrdersProcessorData = void;
export type TSyncPromOrdersProcessorQueue = Queue<TSyncPromOrdersProcessorData>;

export const syncPromOrdersName = 'sync-prom-orders' as const;

@Processor(syncPromOrdersName)
export class SyncPromOrdersConsumer extends CommonSyncConsumer {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly queueName = syncPromOrdersName;

  constructor(
    private readonly syncPromOrdersService: SyncPromOrdersService,
    protected readonly notificationBotService: NotificationBotService,
    @InjectModel(User.name)
    protected readonly userModel: UserModel,
    @InjectConnection()
    protected readonly connection: Connection,
    @InjectQueue(syncProductsName)
    private syncProductsQueue: TSyncProductsProcessorQueue,
  ) {
    super(notificationBotService, userModel, connection);
  }

  // syncProducts
  protected async main(job: Job<TSyncPromOrdersProcessorData>, session) {
    // START
    await this.unionLogger(job, 'Start sync prom orders');

    // 1. Sync
    await this.unionLogger(job, '1. Sync prom orders');

    const { mainResult, productsResult } =
      await this.syncPromOrdersService.syncPromOrders();

    await this.unionLogger(job, '1. Sync prom orders:', {
      main: {
        addedOrdersCount: mainResult.added.length,
        updatedOrdersCount: mainResult.updated.length,
      },
      products: {
        addedPromOrderProductsCount: productsResult.added.length,
        updatedPromOrderProductsCount: productsResult.updated.length,
      },
    });

    // 2. Init Job "Sync Prom Products"
    await this.unionLogger(job, '2. Init Job "Sync Prom Products"');

    const syncPromProductsJob = await this.syncProductsQueue.add(null);

    await this.unionLogger(job, '2. Job "Sync Prom Products" initiated:', {
      id: syncPromProductsJob.id,
      name: syncPromProductsJob.queue.name,
      data: syncPromProductsJob.data,
    });

    // 3. Notify
    await this.unionLogger(job, '3. Notify Admin');

    await this.notifyAdmin(this.getReadableQueueName(), {
      addedOrdersCount: mainResult.added.length,
      updatedOrdersCount: mainResult.updated.length,
      initiatedQueues: [
        {
          id: syncPromProductsJob.id,
          name: syncPromProductsJob.queue.name,
        },
      ],
    });

    // 4. Result
    await this.unionLogger(job, '4. Build result');

    const result = {
      main: {
        addedOrders: mainResult.added,
        updatedOrders: mainResult.updated,
      },
      products: {
        addedPromOrderProducts: productsResult.added,
        updatedPromOrderProducts: productsResult.updated,
      },
      syncProductsJob: {
        id: syncPromProductsJob.id,
        name: syncPromProductsJob.queue.name,
      },
    };

    // END
    await this.unionLogger(job, 'Complete sync prom orders');

    return result;
  }

  @Process()
  protected async process(job: Job<TSyncPromOrdersProcessorData>) {
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
