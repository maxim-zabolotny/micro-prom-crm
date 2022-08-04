import { Controller, UseFilters, UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { CrmCategoriesService } from './categories.service';
import { MongoExceptionFilter } from '@common/filters';

@Controller('/crm/categories')
@UseFilters(MongoExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class CrmCategoriesController {
  constructor(private readonly crmCategoriesService: CrmCategoriesService) {}
}
