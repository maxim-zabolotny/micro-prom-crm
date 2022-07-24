import { Controller, UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { JobBoardService } from './job-board.service';

@Controller('/admin/jobs')
@UseInterceptors(LoggingInterceptor)
export class JobBoardController {
  constructor(private readonly jobBoardService: JobBoardService) {}
}
