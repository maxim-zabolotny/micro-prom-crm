import { ICategory, ICategoriesTree } from '@lib/microtron/core/category/ICategorie'

export class SaveCategoriesDto {
  isTree: boolean;
  categories: Array<ICategory | ICategoriesTree>;
}