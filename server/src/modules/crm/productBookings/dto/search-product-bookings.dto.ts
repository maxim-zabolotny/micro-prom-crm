import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ProductBookingStatus } from '@schemas/productBooking';

export class SearchProductBookingsDto {
  // BASE
  @IsEnum(ProductBookingStatus)
  @IsOptional()
  status?: ProductBookingStatus;

  // PAGINATION
  @IsNumber()
  @IsNotEmpty()
  limit: number;

  @IsNumber()
  @IsNotEmpty()
  offset: number;
}
