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
import { SyncPromService } from './sync-prom.service';
import { UserRole } from '@schemas/user';
import { Auth } from '@common/decorators';

@Controller('/admin/sync/prom')
@UseInterceptors(LoggingInterceptor)
export class SyncPromController {
  constructor(private readonly syncPromService: SyncPromService) {}

  @Get('/load-all-categories')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  async loadAllNewCategories() {
    return this.syncPromService.loadAllNewCategories();
  }

  @Get('/sync-all-categories')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  syncAllCategories(
    @Query('add', new DefaultValuePipe(true), ParseBoolPipe) add: boolean,
    @Query('remove', new DefaultValuePipe(true), ParseBoolPipe) remove: boolean,
  ) {
    return this.syncPromService.syncAllCategories(add, remove);
  }
}
