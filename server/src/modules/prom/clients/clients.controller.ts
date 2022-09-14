import {
  Controller,
  Get,
  HttpCode,
  Query,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { PromExceptionFilter } from '@common/filters';
import { LoggingInterceptor } from '@common/interceptors';
import { PromClientsService } from './clients.service';
import { Auth } from '@common/decorators';
import { UserRole } from '@schemas/user';

@Controller('/prom/clients')
@UseFilters(PromExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class PromClientsController {
  constructor(private readonly promClientsService: PromClientsService) {}

  @Get('/search')
  @HttpCode(200)
  @Auth(UserRole.General)
  async search(@Query('query') query: string) {
    return this.promClientsService.search(query);
  }
}
