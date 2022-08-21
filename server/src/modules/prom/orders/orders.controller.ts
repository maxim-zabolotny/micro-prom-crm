import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { PromExceptionFilter } from '@common/filters';
import { LoggingInterceptor } from '@common/interceptors';
import { PromOrdersService } from './orders.service';
import { SearchOrdersDto } from './dto/search-orders.dto';

@Controller('/prom/orders')
@UseFilters(PromExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class PromOrdersController {
  constructor(private readonly promOrdersService: PromOrdersService) {}

  @Post('/search')
  @HttpCode(201)
  search(@Body() searchData: SearchOrdersDto) {
    return this.promOrdersService.search(searchData);
  }
}
