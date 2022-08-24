import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { CrmCategoriesService } from './categories.service';
import { MongoExceptionFilter } from '@common/filters';
import { Auth } from '@common/decorators';
import { UserRole } from '@schemas/user';
import { SaveCategoriesDto } from './dto/save-categories.dto';

@Controller('/crm/categories')
@UseFilters(MongoExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class CrmCategoriesController {
  constructor(private readonly crmCategoriesService: CrmCategoriesService) {}

  @Post('/save-to-constant')
  @HttpCode(201)
  @Auth(UserRole.Provider, UserRole.Admin)
  save(@Body() categoriesData: SaveCategoriesDto) {
    return this.crmCategoriesService.saveToConstant(categoriesData);
  }
}
