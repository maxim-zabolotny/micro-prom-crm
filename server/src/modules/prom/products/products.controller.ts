import {
  Controller,
  Get,
  HttpCode,
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
}
