import { Controller, Get, HttpCode, UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { AdminLogService } from './log.service';

@Controller('/admin/logs')
@UseInterceptors(LoggingInterceptor)
export class AdminLogController {
  constructor(private readonly adminLogService: AdminLogService) {}

  @Get('/default')
  @HttpCode(200)
  getDefault() {
    return this.adminLogService.getDefault();
  }
}
