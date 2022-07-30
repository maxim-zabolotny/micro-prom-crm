/*external modules*/
import * as qs from 'query-string';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
/*lib*/
/*types*/
import { Lang } from '../types/api';
import { IResult } from './IResult';
import { TTranslateResponse } from './IResponse';
import { ITranslateRequestOptions, ITranslateRequestRawOptions } from './IRequest';
/*other*/

export {
  IResult,
};

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
      paramsSerializer: (p) => qs.stringify(p),
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
      q: options.text, //this.encodeText(options.text),
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
      sourceText, // this.decodeText(sourceText),
      translatedText, // this.decodeText(translatedText),
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
    dt: [
      't',
      'bd',
      'ex',
      'ld',
      'md',
      'rw',
      'ss',
      // 'at', // add additional information
      // 'qca', // add superfluous spaces
      // 'rm', // add transcription
    ],
    hl: 'en-US',
    ie: 'UTF-8',
    oe: 'UTF-8',
    // dj: 1, // change style of response
  };

  public static DEFAULT_HEADERS = {
    origin: 'https://translate.google.com',
    referer: 'https://translate.google.com/',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
  };

  public static MAX_SENTENCES = 8;
  public static MAX_SENTENCES_LENGTH = 120;
  public static MAX_LENGTH = 170;
}

// Google Translate:
// https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ru&hl=en-US&dt=t&dt=bd&dj=1&source=input&tk=60183.60183&q=hello%20world
/**
 * client: gtx
 * sl: auto
 * tl: ru
 * hl: en-US
 * dt: t
 * dt: bd
 * dj: 1
 * source: input
 * tk: 60183.60183
 * q: hello world
 * */

// Telegram translate:
// "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" + from + "&tl=" + to + "&dt=t&ie=UTF-8&oe=UTF-8&otf=1&ssel=0&tsel=0&kc=7&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&q=" + text
// "https://translate.googleapis.com/translate_a/single?client=gtx&sl=rus&tl=urk&dt=t&ie=UTF-8&oe=UTF-8&otf=1&ssel=0&tsel=0&kc=7&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&q=hello"
/**
 * 'client':  gtx
 * 'sl':  rus
 * 'tl':  urk
 * 'dt'[0]:  t
 * 'dt'[1]:  at
 * 'dt'[2]:  bd
 * 'dt'[3]:  ex
 * 'dt'[4]:  ld
 * 'dt'[5]:  md
 * 'dt'[6]:  qca
 * 'dt'[7]:  rw
 * 'dt'[8]:  rm
 * 'dt'[9]:  ss
 * 'ie':  UTF-8
 * 'oe':  UTF-8
 * 'otf':  1
 * 'ssel':  0
 * 'tsel':  0
 * 'kc':  7
 * 'q':  hello
 * */
