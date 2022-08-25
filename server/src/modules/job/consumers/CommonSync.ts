/*external modules*/
import * as _ from 'lodash';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { NotificationBotService } from '../../telegram/crm-bot/notification/notification.service';
import { UserModel } from '@schemas/user';

export abstract class CommonSyncConsumer {
  protected readonly logger: Logger;
  protected readonly queueName: string;

  // INIT PART: should be init via super() method
  constructor(
    protected readonly notificationBotService: NotificationBotService,
    protected readonly userModel: UserModel,
  ) {}

  // UTILITIES
  protected getReadableQueueName() {
    return this.queueName
      .split('-')
      .map((k) => _.capitalize(k))
      .join(' ');
  }

  protected async unionLogger(
    job: Job,
    message: string,
    data: string | object = {},
  ) {
    this.logger.log(message, data);
    await job.log(
      `${message} ${typeof data === 'object' ? JSON.stringify(data) : data}`,
    );
  }

  protected async notifyAdmin(title: string, obj: Record<string, unknown>) {
    const admin = await this.userModel.getAdmin();
    await this.notificationBotService.send({
      to: String(admin.telegramId),
      title: title,
      jsonObject: obj,
    });
  }

  // EVENTS
  protected onActive(job: Job) {
    this.logger.debug(
      `Processing job ${job.id} of Queue ${job.queue.name} with data:`,
      job.data,
    );
  }

  protected onComplete(job: Job, result: Record<string, unknown>) {
    this.logger.debug(
      `Job ${job.id} of Queue ${job.queue.name}: completed with result:`,
      result,
    );
  }

  protected async onFail(job: Job, err: Error) {
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
