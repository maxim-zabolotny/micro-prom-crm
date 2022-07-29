import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SetMarkupDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsNumber()
  @IsNotEmpty()
  markup: number;
}
