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
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { SaveCategoriesDto } from './dto/save-categories.dto';
import { MicrotronExceptionFilter } from '@common/filters';
import { JwtAuthGuard, RolesGuard } from '@common/guards';
import { Roles } from '@common/decorators';
import { UserRole } from '@schemas/user';

@Controller('/microtron/categories')
@UseFilters(MicrotronExceptionFilter)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('/')
  @HttpCode(200)
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
  @Roles(UserRole.Provider, UserRole.Admin)
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, RolesGuard)
  save(@Body() categoriesData: SaveCategoriesDto) {
    return this.categoriesService.save(categoriesData);
  }
}
