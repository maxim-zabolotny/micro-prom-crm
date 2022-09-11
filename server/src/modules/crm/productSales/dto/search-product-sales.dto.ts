import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ProductSaleStatus } from '@schemas/productSale';

export class SearchProductSalesDto {
  // BASE
  @IsEnum(ProductSaleStatus)
  @IsOptional()
  status?: ProductSaleStatus;

  @IsString()
  @IsOptional()
  productName?: string;

  @IsNumber()
  @IsOptional()
  productMicrotronId?: number;

  // PAGINATION
  @IsNumber()
  @IsNotEmpty()
  limit: number;

  @IsNumber()
  @IsNotEmpty()
  offset: number;
}
