import { Controller, Get, HttpCode, UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { SyncPromService } from './sync-prom.service';

@Controller('/admin/sync/local')
@UseInterceptors(LoggingInterceptor)
export class SyncPromController {
  constructor(private readonly syncLocalService: SyncPromService) {}

  @Get('/load-all-categories')
  @HttpCode(200)
  // @Auth(UserRole.Admin)
  async loadAllCategories() {
    return {};
  }

  @Get('/sync-all-categories')
  @HttpCode(200)
  // @Auth(UserRole.Admin)
  syncAllCategories() {
    return {};
  }
}
