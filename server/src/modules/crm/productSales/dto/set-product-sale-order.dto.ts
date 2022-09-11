import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SetProductSaleOrderDto {
  @IsString()
  @IsNotEmpty()
  productSaleId: string;

  @IsNumber()
  @IsNotEmpty()
  promOrderId: number;
}
