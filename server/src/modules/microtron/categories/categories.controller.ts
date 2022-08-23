import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  ParseBoolPipe,
  Put,
  Query,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { MicrotronCategoriesService } from './categories.service';
import { SaveCategoriesDto } from './dto/save-categories.dto';
import { MicrotronExceptionFilter } from '@common/filters';
import { Auth, DisableEndpoint, TimeoutLimit } from '@common/decorators';
import { LoggingInterceptor } from '@common/interceptors';
import { UserRole } from '@schemas/user';
import { SetMarkupDto } from './dto/set-markup.dto';

@Controller('/microtron/categories')
@UseFilters(MicrotronExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class MicrotronCategoriesController {
  constructor(
    private readonly microtronCategoriesService: MicrotronCategoriesService,
  ) {}

  @Get('/')
  @HttpCode(200)
  @TimeoutLimit(5000)
  async get(
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe) force: boolean,
    @Query('tree', new DefaultValuePipe(false), ParseBoolPipe) tree: boolean,
  ) {
    return this.microtronCategoriesService.getByAPI(force, tree);
  }

  @Get('/saved')
  @HttpCode(200)
  getSaved(
    @Query('tree', new DefaultValuePipe(false), ParseBoolPipe) tree: boolean,
  ) {
    return this.microtronCategoriesService.getSaved(tree);
  }

  @Put('/save')
  @HttpCode(201)
  @Auth(UserRole.Provider, UserRole.Admin)
  save(@Body() categoriesData: SaveCategoriesDto) {
    return this.microtronCategoriesService.save(categoriesData);
  }

  @Put('/set-markup')
  @HttpCode(201)
  @Auth(UserRole.Provider, UserRole.Admin)
  @DisableEndpoint()
  setMarkup(@Body() markupCategoryData: SetMarkupDto) {
    return this.microtronCategoriesService.setMarkup(markupCategoryData);
  }

  @Get('/saved-ru-translate')
  @HttpCode(200)
  getSavedRUTranslate(
    @Query('tree', new DefaultValuePipe(false), ParseBoolPipe) tree: boolean,
  ) {
    return this.microtronCategoriesService.getSavedRUTranslate(tree);
  }
}
