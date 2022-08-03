import { ICategoryInConstant } from '@common/interfaces/category/category-in-constant.interface';

export interface ITranslatedCategoryInConstant extends ICategoryInConstant {
  ruName: string;
}

export interface ITranslatedCategoryTreeInConstant
  extends Omit<ITranslatedCategoryInConstant, 'parentId'> {
  children: ITranslatedCategoryTreeInConstant[];
}
