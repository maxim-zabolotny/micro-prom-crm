import { ITranslatedCategoryInConstant } from '@common/interfaces/category';
import { Types } from 'mongoose';

export type TAddCategoryToDB = ITranslatedCategoryInConstant & {
  course: number;
  integrationId: Types.ObjectId;
};
