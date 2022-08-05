import { Controller, UseFilters, UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { MongoExceptionFilter } from '@common/filters';
import { CrmProductService } from './product.service';

@Controller('/crm/products')
@UseFilters(MongoExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class CrmCategoriesController {
  constructor(private readonly crmProductService: CrmProductService) {}
}
