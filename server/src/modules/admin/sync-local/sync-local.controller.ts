import { Controller, Get, HttpCode, UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { SyncLocalService } from './sync-local.service';

@Controller('/admin/sync/local')
@UseInterceptors(LoggingInterceptor)
export class SyncLocalController {
  constructor(private readonly syncLocalService: SyncLocalService) {}

  @Get('/load-all-categories')
  @HttpCode(200)
  async loadAllCategories() {
    return {};
  }

  @Get('/sync-all-categories')
  @HttpCode(200)
  syncAllCategories() {
    return {};
  }
}
