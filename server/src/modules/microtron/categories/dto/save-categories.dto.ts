import { IsArray, IsBoolean, IsNotEmpty } from 'class-validator';
import {
  ICategoriesTree,
  ICategory,
} from '@lib/microtron/core/category/ICategorie';

export class SaveCategoriesDto {
  @IsBoolean()
  @IsNotEmpty()
  isTree: boolean;

  @IsArray()
  categories: Array<ICategory | ICategoriesTree>;
}
