import {
  Controller,
  Get,
  HttpCode,
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

  @Get('/load-all-products')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  async loadAllProducts() {
    return this.syncLocalService.loadAllProductsToDB();
  }

  @Get('/load-products-by-category')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  async loadProductsByCategory(@Query('microtronId') microtronId: string) {
    return this.syncLocalService.loadAllProductsByCategoryToDB(microtronId);
  }

  @Get('/actualize-all-products')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  async actualizeAllProducts() {
    return this.syncLocalService.actualizeAllProducts();
  }

  @Get('/actualize-products-by-category')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  async actualizeProductsByCategory(@Query('microtronId') microtronId: string) {
    return this.syncLocalService.actualizeProductsByCategory(microtronId);
  }

  @Get('/sync-course')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  async syncCourse() {
    return this.syncLocalService.syncCourse();
  }

  @Get('/sync-markup')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  async syncMarkup() {
    return this.syncLocalService.syncMarkup();
  }

  @Get('/actualize-categories')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  async actualizeCategories() {
    return this.syncLocalService.actualizeCategories();
  }

  @Get('/test')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  async test() {
    return this.syncLocalService.test();
  }
}
