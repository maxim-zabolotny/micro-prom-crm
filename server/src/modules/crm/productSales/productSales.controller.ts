import {
  Body,
  Controller,
  HttpCode,
  Put,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { MongoExceptionFilter } from '@common/filters';
import { CrmProductSalesService } from './productSales.service';
import { Auth } from '@common/decorators';
import { UserRole } from '@schemas/user';
import { SetProductSaleDescriptionDto } from './dto/set-product-sale-description.dto';
import { SetProductSaleOrderDto } from './dto/set-product-sale-order.dto';
import { SetProductSaleClientDto } from './dto/set-product-sale-client.dto';

@Controller('/crm/product-sales')
@UseFilters(MongoExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class CrmProductSalesController {
  constructor(
    private readonly crmProductSalesService: CrmProductSalesService,
  ) {}

  @Put('/set-description')
  @HttpCode(201)
  @Auth(UserRole.Sales)
  setProductSaleDescription(@Body() data: SetProductSaleDescriptionDto) {
    return this.crmProductSalesService.setProductSaleDescription(data);
  }

  @Put('/set-order')
  @HttpCode(201)
  @Auth(UserRole.Sales)
  setProductSaleOrder(@Body() data: SetProductSaleOrderDto) {
    return this.crmProductSalesService.setProductSaleOrder(data);
  }

  @Put('/set-client')
  @HttpCode(201)
  @Auth(UserRole.Sales)
  setProductSaleClient(@Body() data: SetProductSaleClientDto) {
    return this.crmProductSalesService.setProductSaleClient(data);
  }
}
