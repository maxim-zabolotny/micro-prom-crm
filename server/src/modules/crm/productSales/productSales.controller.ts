import { Controller, UseFilters, UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { MongoExceptionFilter } from '@common/filters';
import { CrmProductSalesService } from './productSales.service';

@Controller('/crm/product-sales')
@UseFilters(MongoExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class CrmProductSalesController {
  constructor(
    private readonly crmProductBookingsService: CrmProductSalesService,
  ) {}
}
