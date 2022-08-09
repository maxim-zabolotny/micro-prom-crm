import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  ParseArrayPipe,
  ParseBoolPipe,
  ParseEnumPipe,
  Post,
  Query,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { MicrotronProductsService } from './products.service';
import { MicrotronExceptionFilter } from '@common/filters';
import { TimeoutLimit } from '@common/decorators';
import { LoggingInterceptor } from '@common/interceptors';
import { TranslateProductDto } from './dto/translate-product.dto';
import { Types as GoogleTranslateTypes } from '@lib/google-translate';
import { ParseProductsDto } from './dto/parse-products.dto';

@Controller('/microtron/products')
@UseFilters(MicrotronExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class MicrotronProductsController {
  constructor(
    private readonly microtronProductsService: MicrotronProductsService,
  ) {}

  @Get('/')
  @HttpCode(200)
  @TimeoutLimit(35000)
  async get(
    @Query('categories', ParseArrayPipe)
    categories: string[],
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe)
    force: boolean,
  ) {
    return this.microtronProductsService.getProductsByAPI(categories, force);
  }

  @Get('/all-products-by-saved-categories')
  @HttpCode(200)
  async getAllBySavedCategories(
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe)
    force: boolean,
  ) {
    return this.microtronProductsService.getProductsByAllSavedCategories(force);
  }

  @Get('/cached')
  @HttpCode(200)
  getCached(
    @Query('products', new ParseArrayPipe({ items: Number }))
    products: number[],
  ) {
    return this.microtronProductsService.getCachedByIds(products);
  }

  @Get('/cached-by-categories')
  @HttpCode(200)
  getCachedByCategories(
    @Query('categories', ParseArrayPipe)
    categories: string[],
  ) {
    return this.microtronProductsService.getCachedByCategories(categories);
  }

  @Get('/all-cached')
  @HttpCode(200)
  getAllCached() {
    return this.microtronProductsService.getAllCachedProducts();
  }

  @Get('/parse')
  @HttpCode(200)
  getParse(
    @Query('url')
    url: string,
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe)
    force: boolean,
  ) {
    return this.microtronProductsService.parse(url, force);
  }

  @Get('/parse-ru')
  @HttpCode(200)
  getParseRU(
    @Query('url')
    url: string,
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe)
    force: boolean,
  ) {
    return this.microtronProductsService.parseRU(url, force);
  }

  @Post('/parse-products')
  @HttpCode(201)
  getParseProducts(
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe)
    force: boolean,
    @Body() productsData: ParseProductsDto,
  ) {
    return this.microtronProductsService.parseProducts(
      productsData.products,
      force,
    );
  }

  @Post('/translate')
  @HttpCode(201)
  getTranslate(
    @Body() productData: TranslateProductDto,
    @Query('from', new ParseEnumPipe(GoogleTranslateTypes.Lang))
    from: GoogleTranslateTypes.Lang,
    @Query('to', new ParseEnumPipe(GoogleTranslateTypes.Lang))
    to: GoogleTranslateTypes.Lang,
  ) {
    return this.microtronProductsService.translate(productData, from, to);
  }
}
