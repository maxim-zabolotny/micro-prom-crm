import { Controller, UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { CrmCategoriesService } from './categories.service';

@Controller('/crm/categories')
@UseInterceptors(LoggingInterceptor)
export class CrmCategoriesController {
  constructor(private readonly crmCategoriesService: CrmCategoriesService) {}
}
