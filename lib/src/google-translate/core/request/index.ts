/*external modules*/
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
/*lib*/
/*types*/
import { Lang } from '../types/api';
import { IResult } from './IResult';
import { TTranslateResponse } from './IResponse';
import { ITranslateRequestOptions, ITranslateRequestRawOptions } from './IRequest';
/*other*/

export class Request {
  protected config: AxiosRequestConfig;
  protected axios: AxiosInstance;

  protected userAgent = Request.DEFAULT_HEADERS['user-agent'];

  constructor({ config }: { config?: AxiosRequestConfig } = {}) {
    this.config = config ?? {};
    this.axios = axios.create({
      headers: {
        ...Request.DEFAULT_HEADERS,
      },
    });
  }

  protected encodeText(text: string) {
    return encodeURIComponent(text);
  }

  protected decodeText(text: string) {
    return decodeURIComponent(text);
  }

  protected prepareRequestOptions(options: ITranslateRequestOptions): ITranslateRequestRawOptions {
    return {
      q: this.encodeText(options.text),
      sl: options.from,
      tl: options.to,
    };
  }

  protected parseResult(result: TTranslateResponse, targetLang: Lang): IResult {
    const [translatedText, sourceText] = result[0][0];
    const sourceLang = result[2];

    return {
      sourceLang,
      targetLang,
      sourceText: this.decodeText(sourceText),
      translatedText: this.decodeText(translatedText),
    };
  }

  protected async makeRequest(
    options: ITranslateRequestRawOptions,
  ): Promise<AxiosResponse<TTranslateResponse>> {
    return this.axios({
      ...this.config,
      baseURL: Request.HOST,
      method: Request.METHOD,
      params: {
        ...Request.DEFAULT_PARAMS,
        ...options,
      },
      headers: {
        'user-agent': this.userAgent,
      },
    });
  }

  public setUserAgent(agent: string) {
    this.userAgent = agent;
  }

  public getUserAgent() {
    return this.userAgent;
  }

  public async translate(text: string, from: Lang, to: Lang) {
    const options = this.prepareRequestOptions({ text, from, to });
    const { data } = await this.makeRequest(options);

    return this.parseResult(data, to);
  }

  public static HOST = 'https://translate.googleapis.com/translate_a/single';
  public static METHOD = 'GET';

  public static DEFAULT_PARAMS = {
    client: 'gtx',
    dt: 't',
  };

  public static DEFAULT_HEADERS = {
    origin: 'https://translate.google.com',
    referer: 'https://translate.google.com/',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
  };
}
