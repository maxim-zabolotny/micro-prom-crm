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
import { CategoriesService } from './categories.service';
import { SaveCategoriesDto } from './dto/save-categories.dto';
import { MicrotronExceptionFilter } from '@common/filters';
import { Auth, Timeout } from '@common/decorators';
import { UserRole } from '@schemas/user';
import { LoggingInterceptor, TimeoutInterceptor } from '@common/interceptors';

@Controller('/microtron/categories')
@UseFilters(MicrotronExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('/')
  @HttpCode(200)
  @Timeout(5000)
  @UseInterceptors(TimeoutInterceptor)
  async get(
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe) force: boolean,
    @Query('tree', new DefaultValuePipe(false), ParseBoolPipe) tree: boolean,
  ) {
    return this.categoriesService.getByAPI(force, tree);
  }

  @Get('/saved')
  @HttpCode(200)
  getSaved(
    @Query('tree', new DefaultValuePipe(false), ParseBoolPipe) tree: boolean,
  ) {
    return this.categoriesService.getSaved(tree);
  }

  @Put('/save')
  @HttpCode(201)
  @Auth(UserRole.Provider, UserRole.Admin)
  save(@Body() categoriesData: SaveCategoriesDto) {
    return this.categoriesService.save(categoriesData);
  }
}
