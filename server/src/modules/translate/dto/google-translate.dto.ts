import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Types } from '@lib/google-translate';

export class GoogleTranslateDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsEnum(Types.Lang)
  @IsNotEmpty()
  from: Types.Lang;

  @IsEnum(Types.Lang)
  @IsNotEmpty()
  to: Types.Lang;
}
