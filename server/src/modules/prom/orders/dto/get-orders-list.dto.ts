import { IsArray, IsDate, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { Order as PromOrder } from '@lib/prom';

export class GetOrdersListDto {
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  searchFrom?: Date;

  @IsDate()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  searchTo?: Date;

  @IsArray()
  @IsEnum(PromOrder.OrderStatus, { each: true })
  @IsOptional()
  statuses?: PromOrder.OrderStatus[] = [];

  @IsNumber()
  @IsOptional()
  limit: number;

  @IsNumber()
  @IsOptional()
  fromId?: number;
}
