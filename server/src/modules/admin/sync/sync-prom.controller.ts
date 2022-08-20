import {
  Controller,
  Get,
  HttpCode,
  Query,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { UserRole } from '@schemas/user';
import { Auth } from '@common/decorators';
import { SyncPromService } from '../../sync/prom/sync-prom.service';
import { MongoExceptionFilter } from '@common/filters';

@Controller('/admin/sync/prom')
@UseFilters(MongoExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class SyncPromController {
  constructor(private readonly syncPromService: SyncPromService) {}

  @Get('/load-all-categories')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  async loadAllCategories() {
    return this.syncPromService.loadAllCategoriesToSheet();
  }

  @Get('/reload-all-categories')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  async reloadAllCategories() {
    return this.syncPromService.reloadAllCategoriesToSheet();
  }

  @Get('/load-all-products')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  async loadAllProducts() {
    return this.syncPromService.loadAllProductsToSheet();
  }

  @Get('/reload-all-products')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  async reloadAllProducts() {
    return this.syncPromService.reloadAllProductsToSheet();
  }

  @Get('/load-products-by-category')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  async loadProductsByCategory(@Query('microtronId') microtronId: string) {
    return this.syncPromService.loadAllProductsByCategoryToSheet(microtronId);
  }

  @Get('/test')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  async test() {
    return this.syncPromService.test();
  }
}
