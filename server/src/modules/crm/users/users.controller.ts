import {
  Controller,
  Get,
  HttpCode,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { MongoExceptionFilter } from '@common/filters';
import { CrmUsersService } from './users.service';

@Controller('/crm/users')
@UseFilters(MongoExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class CrmUsersController {
  constructor(private readonly crmUsersService: CrmUsersService) {}

  @Get('/all')
  @HttpCode(200)
  async getAllUsers() {
    return this.crmUsersService.getAllUsers();
  }
}
