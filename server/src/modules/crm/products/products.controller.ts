import {
  Controller,
  Get,
  HttpCode,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { MongoExceptionFilter } from '@common/filters';
import { CrmProductsService } from './products.service';

@Controller('/crm/products')
@UseFilters(MongoExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class CrmProductsController {
  constructor(private readonly crmProductsService: CrmProductsService) {}

  @Get('/all')
  @HttpCode(200)
  async getAllProducts() {
    return this.crmProductsService.getAllProducts();
  }
}
