import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Order as PromOrder } from '@lib/prom';

export class SearchOrdersDto {
  @IsDate()
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  searchFrom: Date;

  @IsArray()
  @IsEnum(PromOrder.OrderStatus, { each: true })
  @IsNotEmpty()
  statuses: PromOrder.OrderStatus[];

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
