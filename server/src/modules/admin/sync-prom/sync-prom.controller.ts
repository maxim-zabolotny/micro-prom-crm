import { Controller, Get, HttpCode, UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { SyncPromService } from './sync-prom.service';

@Controller('/admin/sync/prom')
@UseInterceptors(LoggingInterceptor)
export class SyncPromController {
  constructor(private readonly syncPromService: SyncPromService) {}

  @Get('/load-all-categories')
  @HttpCode(200)
  // @Auth(UserRole.Admin)
  async loadAllCategories() {
    return this.syncPromService.loadAllCategories();
  }

  @Get('/sync-all-categories')
  @HttpCode(200)
  // @Auth(UserRole.Admin)
  syncAllCategories() {
    return {};
  }
}
