import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Types } from '@lib/google-translate';

export class AutoTranslateDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsEnum(Types.Lang)
  @IsNotEmpty()
  to: Types.Lang;
}
