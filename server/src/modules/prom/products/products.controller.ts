import {
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { PromExceptionFilter } from '@common/filters';
import { LoggingInterceptor } from '@common/interceptors';
import { PromProductsService } from './products.service';
import { Auth } from '@common/decorators';
import { UserRole } from '@schemas/user';

@Controller('/prom/products')
@UseFilters(PromExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class PromProductsController {
  constructor(private readonly promProductsService: PromProductsService) {}

  @Get('/list')
  @HttpCode(200)
  @Auth(UserRole.General)
  async getList() {
    return this.promProductsService.getList();
  }

  @Post('/import-sheet')
  @HttpCode(201)
  @Auth(UserRole.Admin)
  async importSheet() {
    return this.promProductsService.importSheet();
  }

  @Get('/import-status')
  @HttpCode(200)
  @Auth(UserRole.General)
  async getImportStatus(
    @Query('importId')
    importId: string,
  ) {
    return this.promProductsService.getImportStatus(importId);
  }
}
