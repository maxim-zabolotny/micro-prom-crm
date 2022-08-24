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

export type TInitLoadSheetProcessorData = void;
export type TInitLoadSheetProcessorQueue = Queue<TInitLoadSheetProcessorData>;

export const initLoadSheetName = 'init-load-sheet' as const;

@Processor(initLoadSheetName)
export class InitLoadSheetConsumer {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly syncLocalService: SyncLocalService,
    private readonly syncPromService: SyncPromService,
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
  async initLoadSheet(job: Job<TInitLoadSheetProcessorData>) {}

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
