import { Controller, HttpCode, Post, UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { JobBoardService } from '../../job/board/job-board.service';

@Controller('/admin/jobs')
@UseInterceptors(LoggingInterceptor)
export class JobBoardController {
  constructor(private readonly jobBoardService: JobBoardService) {}

  @Post('/test-audio')
  @HttpCode(201)
  addAudioJob() {
    return this.jobBoardService.addAudioJob();
  }
}
