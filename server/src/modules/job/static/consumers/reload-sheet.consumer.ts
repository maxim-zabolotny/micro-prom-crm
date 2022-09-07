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
import * as _ from 'lodash';

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
    protected readonly notificationBotService: NotificationBotService,
    @InjectModel(User.name)
    protected readonly userModel: UserModel,
    @InjectConnection()
    protected readonly connection: Connection,
  ) {
    super(notificationBotService, userModel, connection);
  }

  // reloadSheet
  protected async main(job: Job<TReloadSheetProcessorData>, session) {}

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
