import {
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  ParseArrayPipe,
  ParseBoolPipe,
  Query,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { MicrotronExceptionFilter } from '@common/filters';
import { TimeoutLimit } from '@common/decorators';
import { LoggingInterceptor } from '@common/interceptors';

@Controller('/microtron/products')
@UseFilters(MicrotronExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('/')
  @HttpCode(200)
  @TimeoutLimit(35000)
  async get(
    @Query('categories', ParseArrayPipe)
    categories: string[],
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe)
    force: boolean,
  ) {
    return this.productsService.getProductsByAPI(categories, force);
  }

  @Get('/cached')
  @HttpCode(200)
  getCached(
    @Query('products', new ParseArrayPipe({ items: Number }))
    products: number[],
  ) {
    return this.productsService.getCachedByIds(products);
  }

  @Get('/cached-by-categories')
  @HttpCode(200)
  getCachedByCategories(
    @Query('categories', ParseArrayPipe)
    categories: string[],
  ) {
    return this.productsService.getCachedByCategories(categories);
  }

  @Get('/all-cached')
  @HttpCode(200)
  getAllCached() {
    return this.productsService.getAllCachedProducts();
  }

  @Get('/parse')
  @HttpCode(200)
  getParse(
    @Query('url')
    url: string,
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe)
    force: boolean,
  ) {
    return this.productsService.parse(url, force);
  }
}
