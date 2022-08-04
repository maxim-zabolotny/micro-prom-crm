/*external modules*/
import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  OnQueueProgress,
  Process,
  Processor,
} from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { Logger } from '@nestjs/common';

export type TAudioProcessorData = void;
export type TAudioProcessorQueue = Queue<TAudioProcessorData>;

export const audioProcessorName = 'audio' as const;

@Processor(audioProcessorName)
export class AudioConsumer {
  private readonly logger = new Logger(this.constructor.name);

  @Process()
  async transcode(job: Job<TAudioProcessorData>) {
    let progress = 0;
    for (let i = 0; i < 10; i++) {
      progress += 10;
      await job.progress(progress);
    }
    return {};
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(
      `Processing job ${job.id} of Queue ${job.queue.name} with data:`,
      job.data,
    );
  }

  @OnQueueProgress()
  onProgress(job: Job, progress: number) {
    this.logger.debug(
      `Processing job ${job.id} of Queue ${job.queue.name}: progress - ${progress}`,
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
  onFail(job: Job, err: Error) {
    this.logger.debug(
      `Job ${job.id} of Queue ${job.queue.name} failed with error`,
      err,
    );
  }
}
