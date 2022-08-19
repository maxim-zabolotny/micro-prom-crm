import { Controller, UseFilters, UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { MongoExceptionFilter } from '@common/filters';
import { CrmIntegrationsService } from './integrations.service';

@Controller('/crm/integrations')
@UseFilters(MongoExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class CrmIntegrationsController {
  constructor(
    private readonly crmIntegrationsService: CrmIntegrationsService,
  ) {}
}
