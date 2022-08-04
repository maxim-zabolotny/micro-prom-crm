import {
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  ParseBoolPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
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
    return this.syncLocalService.loadAllCategoriesFromConstant();
  }

  @Get('/sync-all-categories')
  @HttpCode(200)
  // @Auth(UserRole.Admin)
  syncAllCategories(
    @Query('add', new DefaultValuePipe(true), ParseBoolPipe) add: boolean,
    @Query('update', new DefaultValuePipe(true), ParseBoolPipe) update: boolean,
    @Query('remove', new DefaultValuePipe(true), ParseBoolPipe) remove: boolean,
  ) {
    return this.syncLocalService.syncAllCategoriesWithConstant(
      add,
      update,
      remove,
    );
  }
}