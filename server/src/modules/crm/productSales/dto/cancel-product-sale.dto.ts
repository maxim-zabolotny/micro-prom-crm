import { IsNotEmpty, IsString } from 'class-validator';

export class CancelProductSaleDto {
  @IsString()
  @IsNotEmpty()
  productSaleId: string;

  @IsString()
  @IsNotEmpty()
  canceledReason: string;
}
