import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class SetProductSaleClientDto {
  @IsString()
  @IsNotEmpty()
  productSaleId: string;

  @IsNumber()
  @IsNotEmpty()
  promClientId: number;

  @IsString()
  @IsNotEmpty()
  promClientName: string;

  @IsArray()
  @IsEmail({}, { each: true })
  @IsNotEmpty()
  promClientEmails: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  promClientPhones: string[];
}
