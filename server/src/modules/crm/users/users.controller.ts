import { Controller, UseFilters, UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { MongoExceptionFilter } from '@common/filters';
import { CrmUsersService } from './users.service';

@Controller('/crm/users')
@UseFilters(MongoExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class CrmUsersController {
  constructor(private readonly crmUsersService: CrmUsersService) {}
}
