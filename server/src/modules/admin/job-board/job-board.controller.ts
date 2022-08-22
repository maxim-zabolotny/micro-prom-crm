import {
  Controller,
  HttpCode,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { JobBoardService } from '../../job/board/job-board.service';

@Controller('/admin/jobs')
@UseInterceptors(LoggingInterceptor)
export class JobBoardController {
  constructor(private readonly jobBoardService: JobBoardService) {}

  @Post('/test-audio')
  @HttpCode(201)
  addAudioJob() {
    return this.jobBoardService.addAudioJob();
  }

  @Post('/test-load-all-categories')
  @HttpCode(201)
  addLoadAllCategoriesJob() {
    return this.jobBoardService.addLoadAllCategories();
  }

  @Post('/test-load-products-by-category')
  @HttpCode(201)
  addLoadProductsByCategoryJob(@Query('categoryId') categoryId: string) {
    return this.jobBoardService.addLoadProductsByCategory(categoryId);
  }

  @Post('/test-load-all-products')
  @HttpCode(201)
  addLoadAllProductsJob() {
    return this.jobBoardService.addLoadAllProducts();
  }

  @Post('/test-sync-categories')
  @HttpCode(201)
  addSyncCategories() {
    return this.jobBoardService.addSyncCategories();
  }
}
