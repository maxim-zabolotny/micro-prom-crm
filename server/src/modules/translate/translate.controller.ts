import {
  Controller,
  Get,
  HttpCode,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { TranslateService } from './translate.service';
import { ApertiumTranslateDto } from './dto/apertium-translate.dto';
import { GoogleTranslateDto } from './dto/google-translate.dto';
import { AutoTranslateDto } from './dto/auto-translate.dto';

@Controller('translate')
@UseInterceptors(LoggingInterceptor)
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  @Get('/detect')
  @HttpCode(200)
  async detectLanguage(@Query('text') text: string) {
    const result = await this.translateService.detectLanguage(text);

    return result;
  }

  @Get('/apertium')
  @HttpCode(200)
  async apertiumTranslate(@Query() translateData: ApertiumTranslateDto) {
    const result = await this.translateService.translateViaApertium(
      translateData.text,
      translateData.from,
      translateData.to,
    );

    return result;
  }

  @Get('/google')
  @HttpCode(200)
  async googleTranslate(@Query() translateData: GoogleTranslateDto) {
    const result = await this.translateService.translateViaGoogle(
      translateData.text,
      translateData.from,
      translateData.to,
    );

    return result;
  }

  @Get('/auto')
  @HttpCode(200)
  async autoTranslate(@Query() translateData: AutoTranslateDto) {
    const result = await this.translateService.autoTranslate(
      translateData.text,
      translateData.to,
    );

    return result;
  }
}
