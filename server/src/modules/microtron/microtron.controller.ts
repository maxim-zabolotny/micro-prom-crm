import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  ParseBoolPipe,
  Post,
  Query,
} from '@nestjs/common';
import { MicrotronService } from './microtron.service';
import { SaveCategoriesDto } from './dto/save-categories.dto';

@Controller('microtron')
export class MicrotronController {
  constructor(private readonly microtronService: MicrotronService) {}

  @Get('categories')
  @HttpCode(200)
  async getCategories(
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe) force: boolean,
    @Query('tree', new DefaultValuePipe(false), ParseBoolPipe) tree: boolean,
  ) {
    return this.microtronService.getCategoriesByAPI(force, tree);
  }

  @Get('saved-categories')
  @HttpCode(200)
  getSavedCategories(
    @Query('tree', new DefaultValuePipe(false), ParseBoolPipe) tree: boolean,
  ) {
    return this.microtronService.getSavedCategories(tree);
  }

  @Post('save-categories')
  @HttpCode(201)
  saveCategories(@Body() categoriesData: SaveCategoriesDto) {
    return this.microtronService.saveCategories(categoriesData);
  }
}
