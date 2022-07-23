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
  protected useRandomUserAgent = false;

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

  protected getUserAgent() {
    if (this.useRandomUserAgent) {
      const itemIndex = Math.floor(Math.random() * Request.userAgents.length);
      return Request.userAgents[itemIndex];
    }

    return this.userAgent;
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
        'user-agent': this.getUserAgent(),
      },
    });
  }

  public setDefaultUserAgent(agent: string) {
    this.userAgent = agent;
  }

  public getDefaultUserAgent() {
    return this.userAgent;
  }

  public setUseRandomUserAgent(use: boolean) {
    this.useRandomUserAgent = use;
  }

  public async translate(text: string, from: Lang, to: Lang) {
    const options = this.prepareRequestOptions({ text, from, to });
    const { data } = await this.makeRequest(options);

    return this.parseResult(data, to);
  }

  public static addUserAgents(agents: string[]) {
    this.userAgents.push(...agents);
  }

  public static removeUserAgents(agents: string[]) {
    this.userAgents = this.userAgents.filter((agent) => !agents.includes(agent));
  }

  public static userAgents = [
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36', // 13.5%
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36', // 6.6%
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:94.0) Gecko/20100101 Firefox/94.0', // 6.4%
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:95.0) Gecko/20100101 Firefox/95.0', // 6.2%
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36', // 5.2%
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.55 Safari/537.36', // 4.8%
  ];

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
