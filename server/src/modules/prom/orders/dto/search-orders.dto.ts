import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchOrdersDto {
  @IsNumber()
  @IsOptional()
  id: number;

  @IsString()
  @IsOptional()
  clientName: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @IsOptional()
  email: string;

  @IsNumber()
  @IsOptional()
  price: number;

  @IsString()
  @IsOptional()
  productId: string;

  @IsString()
  @IsOptional()
  productName: string;

  @IsNumber()
  @IsOptional()
  productQuantity: number;

  @IsNumber()
  @IsOptional()
  productPrice: number;

  @IsNumber()
  @IsOptional()
  productTotalPrice: number;

  @IsString()
  @IsOptional()
  productUrl: string;
}
