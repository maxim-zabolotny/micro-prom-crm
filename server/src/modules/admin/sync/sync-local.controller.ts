import { Controller, Get, HttpCode, UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { Auth } from '@common/decorators';
import { UserRole } from '@schemas/user';
import { SyncLocalService } from '../../sync/local/sync-local.service';

@Controller('/admin/sync/local')
@UseInterceptors(LoggingInterceptor)
export class SyncLocalController {
  constructor(private readonly syncLocalService: SyncLocalService) {}

  @Get('/load-all-categories')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  async loadAllCategories() {
    return this.syncLocalService.loadAllCategories();
  }

  @Get('/sync-all-categories')
  @HttpCode(200)
  // @Auth(UserRole.Admin)
  syncAllCategories() {
    return {};
  }
}
