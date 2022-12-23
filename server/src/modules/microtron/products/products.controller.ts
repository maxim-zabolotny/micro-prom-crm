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
import { Auth, TimeoutLimit } from '@common/decorators';
import { LoggingInterceptor } from '@common/interceptors';
import { TranslateProductDto } from './dto/translate-product.dto';
import { Types as GoogleTranslateTypes } from '@lib/google-translate';
import { ParseProductsDto } from './dto/parse-products.dto';
import { UserRole } from '@schemas/user';

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
  @Auth(UserRole.General)
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
  @Auth(UserRole.General)
  async getAllBySavedCategories(
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe)
    force: boolean,
  ) {
    return this.microtronProductsService.getAllProductsBySavedCategories(force);
  }

  @Get('/all-products-full-info-by-saved-categories')
  @HttpCode(200)
  @TimeoutLimit(900000)
  @Auth(UserRole.General)
  async getAllFullInfoBySavedCategories(
    @Query('forceParse', new DefaultValuePipe(false), ParseBoolPipe)
    forceParse: boolean,
    @Query('forceLoad', new DefaultValuePipe(true), ParseBoolPipe)
    forceLoad: boolean,
  ) {
    return this.microtronProductsService.getAllProductsFullInfoBySavedCategories(
      forceLoad,
      forceParse,
    );
  }

  @Get('/cached')
  @HttpCode(200)
  @Auth(UserRole.General)
  getCached(
    @Query('products', new ParseArrayPipe({ items: Number }))
    products: number[],
  ) {
    return this.microtronProductsService.getCachedByIds(products);
  }

  @Get('/cached-by-categories')
  @HttpCode(200)
  @Auth(UserRole.General)
  getCachedByCategories(
    @Query('categories', ParseArrayPipe)
    categories: string[],
  ) {
    return this.microtronProductsService.getCachedByCategories(categories);
  }

  @Get('/all-cached')
  @HttpCode(200)
  @Auth(UserRole.General)
  getAllCached() {
    return this.microtronProductsService.getAllCachedProducts();
  }

  @Get('/parse')
  @HttpCode(200)
  @Auth(UserRole.General)
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
  @Auth(UserRole.General)
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
  @Auth(UserRole.General)
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
  @Auth(UserRole.General)
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
