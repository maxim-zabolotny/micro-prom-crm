import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CategoryDto } from './category.dto';

export class SaveCategoriesDto {
  @IsArray()
  @Type(() => CategoryDto)
  @ValidateNested({ each: true })
  @IsNotEmpty()
  categories: Array<CategoryDto>;
}
