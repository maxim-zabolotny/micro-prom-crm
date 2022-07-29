import { Category } from '@lib/microtron';

export interface ICategoryInConstant extends Category.ICategory {
  markup: number;
}

export interface ICategoryTreeInConstant
  extends Omit<ICategoryInConstant, 'parentId'> {
  children: ICategoryInConstant[];
}
