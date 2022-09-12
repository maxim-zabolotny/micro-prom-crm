import { IsDate, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class SaleProductSaleDto {
  @IsString()
  @IsNotEmpty()
  productSaleId: string;

  @IsDate()
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  saleAt: Date;
}
