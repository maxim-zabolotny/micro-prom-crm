import { Category } from '@lib/microtron';

export interface ICategoryInConstant extends Category.ICategory {
  markup: number;
  promName: string;
}

export interface ICategoryTreeInConstant
  extends Omit<ICategoryInConstant, 'parentId'> {
  children: ICategoryTreeInConstant[];
}
