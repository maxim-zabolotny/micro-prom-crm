import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SetProductSaleDescriptionDto {
  @IsString()
  @IsNotEmpty()
  productSaleId: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
