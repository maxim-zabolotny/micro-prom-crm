import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ICategoryInConstant } from '@common/interfaces/category';

export class CategoryDto implements ICategoryInConstant {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  parentId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  markup = 0; // default
}
