import { IsArray, IsBoolean, IsNotEmpty } from 'class-validator';
import {
  ICategoryInConstant,
  ICategoryTreeInConstant,
} from '@common/interfaces/category';

export class SaveCategoriesDto {
  @IsBoolean()
  @IsNotEmpty()
  isTree: boolean;

  @IsArray()
  categories: Array<ICategoryInConstant | ICategoryTreeInConstant>;
}
