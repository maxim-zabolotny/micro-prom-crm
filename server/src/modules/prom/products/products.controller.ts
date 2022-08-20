import {
  Controller,
  Get,
  HttpCode,
  ParseIntPipe,
  Query,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { PromExceptionFilter } from '@common/filters';
import { LoggingInterceptor } from '@common/interceptors';
import { PromProductsService } from './products.service';

@Controller('/prom/products')
@UseFilters(PromExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class PromProductsController {
  constructor(private readonly promProductsService: PromProductsService) {}

  @Get('/list')
  @HttpCode(200)
  async getList() {
    return this.promProductsService.getList();
  }

  @Get('/import-sheet')
  @HttpCode(200)
  async importSheet() {
    return this.promProductsService.importSheet();
  }

  @Get('/import-status')
  @HttpCode(200)
  async getImportStatus(
    @Query('importId', ParseIntPipe)
    importId: number,
  ) {
    return this.promProductsService.getImportStatus(importId);
  }
}
