import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class SetProductSalePaidDto {
  @IsString()
  @IsNotEmpty()
  productSaleId: string;

  @IsBoolean()
  @IsNotEmpty()
  paid: boolean;
}
