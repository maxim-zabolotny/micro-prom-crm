import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateProductBookingDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  description = '';

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  count: number;
}
