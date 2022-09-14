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
import { SetOrderDeliveryDto } from './dto/set-order-delivery.dto';
import { Auth } from '@common/decorators';
import { UserRole } from '@schemas/user';

@Controller('/prom/orders')
@UseFilters(PromExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class PromOrdersController {
  constructor(private readonly promOrdersService: PromOrdersService) {}

  @Post('/search')
  @HttpCode(201)
  @Auth(UserRole.General)
  search(@Body() searchData: SearchOrdersDto) {
    return this.promOrdersService.search(searchData);
  }

  @Post('/set-declaration')
  @HttpCode(201)
  @Auth(UserRole.Sales)
  setDeclaration(@Body() declarationData: SetOrderDeliveryDto) {
    return this.promOrdersService.setDeclaration(declarationData);
  }
}
