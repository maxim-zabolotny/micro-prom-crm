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
import { ClientSession } from 'mongodb';

export type TSyncProductsProcessorData = void;
export type TSyncProductsProcessorQueue = Queue<TSyncProductsProcessorData>;

export const syncProductsName = 'sync-products' as const;

@Processor(syncProductsName)
export class SyncProductsConsumer extends CommonSyncConsumer {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly queueName = syncProductsName;

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

  private async syncProducts(
    job: Job<TSyncProductsProcessorData>,
    session: ClientSession,
  ) {}

  @Process()
  protected async process(job: Job<TSyncProductsProcessorData>) {
    return this.withTransaction(job, async (session) => {
      return this.syncProducts(job, session);
    });
  }

  @OnQueueActive()
  protected onActive(job: Job) {
    super.onActive(job);
  }

  @OnQueueCompleted()
  protected onComplete(job: Job, result: Record<string, unknown>) {
    super.onComplete(job, result);
  }

  @OnQueueFailed()
  protected async onFail(job: Job, err: Error) {
    await super.onFail(job, err);
  }
}
