import {Body, Controller, DefaultValuePipe, Get, HttpCode, ParseBoolPipe, Post, Query} from '@nestjs/common';
import { MicrotronService } from './microtron.service';
import {SaveCategoriesDto} from "./dto/save-categories.dto";

@Controller('microtron')
export class MicrotronController {
  constructor(private readonly microtronService: MicrotronService) {}

  @Get('categories')
  @HttpCode(200)
  async getCategories(@Query('force', new DefaultValuePipe(false), ParseBoolPipe) force: boolean) {
    return this.microtronService.getCategories(force);
  }

  @Get('categories-tree')
  @HttpCode(200)
  getCategoriesTree(@Query('force', new DefaultValuePipe(false), ParseBoolPipe) force: boolean) {
    return this.microtronService.getCategoriesTree(force);
  }

  @Get('saved-categories')
  @HttpCode(200)
  getSavedCategories(): string {
    return `GET /saved-categories`;
  }

  @Post('save-categories')
  @HttpCode(201)
  saveCategories(@Body() categories: SaveCategoriesDto): string {
    return `POST /save-categories`;
  }
}
