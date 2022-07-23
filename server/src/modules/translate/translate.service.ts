import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ApertiumAPI, {
  Request as Apertium,
  Types as ApertiumTypes,
} from '@lib/apertium';
import GoogleTranslateAPI, {
  Request as GoogleTranslate,
  Types as GoogleTranslateTypes,
} from '@lib/google-translate';

@Injectable()
export class TranslateService {
  private readonly apertiumAPI: Apertium;
  private readonly googleTranslateAPI: GoogleTranslate;

  constructor(private configService: ConfigService) {
    this.apertiumAPI = new ApertiumAPI.Request();

    this.googleTranslateAPI = new GoogleTranslateAPI.Request();
    this.googleTranslateAPI.setUseRandomUserAgent(true);
  }

  public async detectLanguage(text: string) {
    const lang = await this.apertiumAPI.detectLanguage(text);
    return lang;
  }

  public async translateViaApertium(
    text: string,
    from: ApertiumTypes.Lang,
    to: ApertiumTypes.Lang,
  ) {
    const result = await this.apertiumAPI.translate(text, from, to);
    return result;
  }

  public async translateViaGoogle(
    text: string,
    from: GoogleTranslateTypes.Lang,
    to: GoogleTranslateTypes.Lang,
  ) {
    const result = await this.googleTranslateAPI.translate(text, from, to);
    return result;
  }

  public async autoTranslate(text: string, to: GoogleTranslateTypes.Lang) {
    const result = await this.translateViaGoogle(
      text,
      GoogleTranslateAPI.Types.Lang.Auto,
      to,
    );
    return result;
  }
}
