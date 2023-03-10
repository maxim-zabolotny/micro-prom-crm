import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  Query,
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
import { ParseObjectIdPipe } from '@common/pipes';
import { Types } from 'mongoose';
import { SearchProductSalesDto } from './dto/search-product-sales.dto';
import { DeliveryProductSaleDto } from './dto/delivery-product-sale.dto';
import { SaleProductSaleDto } from './dto/sale-product-sale.dto';
import { CancelProductSaleDto } from './dto/cancel-product-sale.dto';
import { SetProductSalePaidDto } from './dto/set-product-sale-paid.dto';

@Controller('/crm/product-sales')
@UseFilters(MongoExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class CrmProductSalesController {
  constructor(
    private readonly crmProductSalesService: CrmProductSalesService,
  ) {}

  @Get('/')
  @HttpCode(200)
  @Auth(UserRole.General)
  async getById(@Query('id', ParseObjectIdPipe) productSaleId: Types.ObjectId) {
    return this.crmProductSalesService.getById(productSaleId);
  }

  @Post('/search')
  @HttpCode(200)
  @Auth(UserRole.General)
  async search(@Body() findData: SearchProductSalesDto) {
    return this.crmProductSalesService.search(findData);
  }

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

  @Put('/set-paid')
  @HttpCode(201)
  @Auth(UserRole.Sales)
  setProductSalePaid(@Body() data: SetProductSalePaidDto) {
    return this.crmProductSalesService.setProductSalePaid(data);
  }

  @Put('/delivery')
  @HttpCode(201)
  @Auth(UserRole.Sales)
  deliveryProductSale(@Body() data: DeliveryProductSaleDto) {
    return this.crmProductSalesService.deliveryProductSale(data);
  }

  @Put('/sale')
  @HttpCode(201)
  @Auth(UserRole.Sales)
  saleProductSale(@Body() data: SaleProductSaleDto) {
    return this.crmProductSalesService.saleProductSale(data);
  }

  @Put('/cancel')
  @HttpCode(201)
  @Auth(UserRole.Sales)
  cancelProductSale(@Body() data: CancelProductSaleDto) {
    return this.crmProductSalesService.cancelProductSale(data);
  }
}
