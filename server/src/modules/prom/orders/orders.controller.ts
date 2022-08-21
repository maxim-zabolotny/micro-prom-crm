import { Controller, UseFilters, UseInterceptors } from '@nestjs/common';
import { PromExceptionFilter } from '@common/filters';
import { LoggingInterceptor } from '@common/interceptors';
import { PromOrdersService } from './orders.service';

@Controller('/prom/orders')
@UseFilters(PromExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class PromOrdersController {
  constructor(private readonly promOrdersService: PromOrdersService) {}
}
