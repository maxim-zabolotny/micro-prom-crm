import {
  Controller,
  HttpCode,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { JobBoardService } from '../../job/board/job-board.service';
import { Auth } from '@common/decorators';
import { UserRole } from '@schemas/user';

@Controller('/admin/jobs')
@UseInterceptors(LoggingInterceptor)
export class JobBoardController {
  constructor(private readonly jobBoardService: JobBoardService) {}

  @Post('/test-audio')
  @Auth(UserRole.General)
  @HttpCode(201)
  addAudioJob() {
    return this.jobBoardService.addAudioJob();
  }

  @Post('/test-load-all-categories')
  @HttpCode(201)
  @Auth(UserRole.Admin)
  addLoadAllCategoriesJob() {
    return this.jobBoardService.addLoadAllCategories();
  }

  @Post('/test-load-products-by-category')
  @HttpCode(201)
  @Auth(UserRole.Admin)
  addLoadProductsByCategoryJob(@Query('categoryId') categoryId: string) {
    return this.jobBoardService.addLoadProductsByCategory(categoryId);
  }

  @Post('/test-load-all-products')
  @HttpCode(201)
  @Auth(UserRole.Admin)
  addLoadAllProductsJob() {
    return this.jobBoardService.addLoadAllProducts();
  }

  @Post('/test-sync-categories')
  @HttpCode(201)
  @Auth(UserRole.Admin)
  addSyncCategories() {
    return this.jobBoardService.addSyncCategories();
  }

  @Post('/test-sync-course')
  @HttpCode(201)
  @Auth(UserRole.Admin)
  addSyncCourse() {
    return this.jobBoardService.addSyncCourse();
  }

  @Post('/test-init-load-sheet')
  @HttpCode(201)
  @Auth(UserRole.Admin)
  addInitLoadSheet() {
    return this.jobBoardService.addInitLoadSheet();
  }

  @Post('/test-sync-products-by-category')
  @HttpCode(201)
  @Auth(UserRole.Admin)
  addSyncProductsByCategory(@Query('categoryId') categoryId: string) {
    return this.jobBoardService.addSyncProductsByCategory(categoryId);
  }

  @Post('/test-sync-products')
  @HttpCode(201)
  @Auth(UserRole.Admin)
  addSyncProducts() {
    return this.jobBoardService.addSyncProducts();
  }

  @Post('/test-sync-prom-orders')
  @HttpCode(201)
  @Auth(UserRole.Admin)
  addSyncPromOrders() {
    return this.jobBoardService.addSyncPromOrders();
  }

  @Post('/test-reload-sheet')
  @HttpCode(201)
  @Auth(UserRole.Admin)
  addReloadSheet() {
    return this.jobBoardService.addReloadSheet();
  }
}
