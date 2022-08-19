import { IProductFullInfo } from '@common/interfaces/product';
import { CategoryDocument } from '@schemas/category';

export type TAddProductToDB = Omit<IProductFullInfo, 'categoryId'> & {
  category: Pick<CategoryDocument, '_id' | 'microtronId' | 'course' | 'markup'>;
};
