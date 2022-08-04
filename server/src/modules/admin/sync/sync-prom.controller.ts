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
import { UserRole } from '@schemas/user';
import { Auth } from '@common/decorators';
import { SyncPromService } from '../../sync/prom/sync-prom.service';

@Controller('/admin/sync/prom')
@UseInterceptors(LoggingInterceptor)
export class SyncPromController {
  constructor(private readonly syncPromService: SyncPromService) {}

  @Get('/load-all-categories')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  async loadAllCategories() {
    return this.syncPromService.loadAllNewCategoriesToSheet();
  }

  @Get('/sync-all-categories')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  syncAllCategories(
    @Query('add', new DefaultValuePipe(true), ParseBoolPipe) add: boolean,
    @Query('remove', new DefaultValuePipe(true), ParseBoolPipe) remove: boolean,
  ) {
    return this.syncPromService.syncAllCategoriesWithSheet(add, remove);
  }
}