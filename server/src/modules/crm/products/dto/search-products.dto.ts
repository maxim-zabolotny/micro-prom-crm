import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class SearchProductsDto {
  // BASE
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  microtronId?: number;

  @IsNumber()
  @IsOptional()
  promId?: number;

  @IsBoolean()
  @IsOptional()
  loadedOnProm?: boolean;

  // PAGINATION
  @IsNumber()
  @IsNotEmpty()
  limit: number;

  @IsNumber()
  @IsNotEmpty()
  offset: number;
}
