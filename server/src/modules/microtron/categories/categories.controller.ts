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
  @Auth(UserRole.General)
  async get(
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe) force: boolean,
    @Query('tree', new DefaultValuePipe(false), ParseBoolPipe) tree: boolean,
  ) {
    return this.microtronCategoriesService.getByAPI(force, tree);
  }

  @Get('/saved')
  @HttpCode(200)
  @Auth(UserRole.General)
  getSaved(
    @Query('tree', new DefaultValuePipe(false), ParseBoolPipe) tree: boolean,
  ) {
    return this.microtronCategoriesService.getSaved(tree);
  }

  @Put('/set-markup')
  @HttpCode(201)
  @Auth(UserRole.Provider)
  @DisableEndpoint()
  setMarkup(@Body() markupCategoryData: SetMarkupDto) {
    return this.microtronCategoriesService.setMarkup(markupCategoryData);
  }

  @Get('/saved-ru-translate')
  @HttpCode(200)
  @Auth(UserRole.General)
  getSavedRUTranslate(
    @Query('tree', new DefaultValuePipe(false), ParseBoolPipe) tree: boolean,
  ) {
    return this.microtronCategoriesService.getSavedRUTranslate(tree);
  }
}
