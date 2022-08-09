import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { IProductFull } from '@lib/microtron/core/product';
import { Type } from 'class-transformer';

class ParseProductDto implements Pick<IProductFull, 'id' | 'url'> {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
  url: string;
}

export class ParseProductsDto {
  @IsArray()
  @Type(() => ParseProductDto)
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  products: Array<ParseProductDto>;
}
