import {
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  ParseBoolPipe,
  Query,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { Auth } from '@common/decorators';
import { UserRole } from '@schemas/user';
import { SyncLocalService } from '../../sync/local/sync-local.service';
import { MongoExceptionFilter } from '@common/filters';

@Controller('/admin/sync/local')
@UseFilters(MongoExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class SyncLocalController {
  constructor(private readonly syncLocalService: SyncLocalService) {}

  @Get('/load-all-categories')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  async loadAllCategories() {
    return this.syncLocalService.loadAllCategoriesToDB();
  }

  @Get('/sync-all-categories')
  @HttpCode(200)
  @Auth(UserRole.Admin)
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

  @Get('/load-all-products')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  async loadAllProducts() {
    return {};
  }

  @Get('/load-products-by-category')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  async loadProductsByCategory(@Query('categoryId') categoryId: string) {
    return {};
  }
}
