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

@Controller('/prom/clients')
@UseFilters(PromExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class PromClientsController {
  constructor(private readonly promClientsService: PromClientsService) {}

  @Get('/search')
  @HttpCode(200)
  async search(@Query('query') query: string) {
    return this.promClientsService.search(query);
  }
}