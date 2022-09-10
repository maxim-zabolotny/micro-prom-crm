import { IsNotEmpty, IsString } from 'class-validator';

export class DisapproveProductBookingDto {
  @IsString()
  @IsNotEmpty()
  productBookingId: string;

  @IsString()
  @IsNotEmpty()
  disapproveReason: string;
}
