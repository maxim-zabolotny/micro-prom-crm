import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class TranslateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsObject()
  @IsNotEmpty()
  specifications: Record<string, string>;
}
