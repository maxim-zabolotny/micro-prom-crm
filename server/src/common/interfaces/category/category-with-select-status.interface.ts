import { ICategoryInConstant } from './category-in-constant.interface';

export interface ICategoryWithSelectStatus extends ICategoryInConstant {
  selected: boolean;
}

export interface ICategoryTreeWithSelectStatus
  extends Omit<ICategoryWithSelectStatus, 'parentId'> {
  children: ICategoryTreeWithSelectStatus[];
}
