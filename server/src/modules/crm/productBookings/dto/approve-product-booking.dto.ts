import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ApproveProductBookingDto {
  @IsString()
  @IsNotEmpty()
  productBookingId: string;

  @IsNumber()
  @IsNotEmpty()
  rawPrice: number;
}
