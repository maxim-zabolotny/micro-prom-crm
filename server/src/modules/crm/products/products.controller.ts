import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { MongoExceptionFilter } from '@common/filters';
import { CrmProductsService } from './products.service';
import { Auth } from '@common/decorators';
import { UserRole } from '@schemas/user';
import { SearchProductsDto } from './dto/search-products.dto';
import { ParseObjectIdPipe } from '@common/pipes';
import { Types } from 'mongoose';

@Controller('/crm/products')
@UseFilters(MongoExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class CrmProductsController {
  constructor(private readonly crmProductsService: CrmProductsService) {}

  @Get('/')
  @HttpCode(200)
  @Auth(UserRole.General)
  async getById(@Query('id', ParseObjectIdPipe) productId: Types.ObjectId) {
    return this.crmProductsService.getById(productId);
  }

  @Get('/all')
  @HttpCode(200)
  @Auth(UserRole.General)
  async getAllProducts() {
    return this.crmProductsService.getAllProducts();
  }

  @Post('/search')
  @HttpCode(200)
  @Auth(UserRole.General)
  async search(@Body() findData: SearchProductsDto) {
    return this.crmProductsService.search(findData);
  }
}
