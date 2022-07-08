/*external modules*/
import maxBy from 'lodash/maxBy';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosInstance } from 'axios';
import FormData from 'form-data';
/*lib*/
/*types*/
import { Lang } from '../types/api';
import { ITranslateResponse } from './IResponse';
import { IDetectLanguageRequest, ITranslateRequest, TRequestData } from './IRequest';
import { Endpoints } from './Endpoints';
/*other*/

export class Request {
  protected config: AxiosRequestConfig;
  protected axios: AxiosInstance;

  constructor({ config }: { config?: AxiosRequestConfig } = {}) {
    this.config = config ?? {};
    this.axios = axios.create({
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      env: {
        FormData: Request.isBrowser() ? window.FormData : FormData,
      },
    });
  }

  protected async makeRequest<TResult>(
    resource: Endpoints,
    body: TRequestData,
  ): Promise<AxiosResponse<TResult>> {
    return this.axios({
      ...this.config,
      url: resource,
      baseURL: Request.HOST,
      method: Request.METHOD,
      data: body,
    });
  }

  protected buildDetectLanguageBody(text: string): IDetectLanguageRequest {
    return {
      q: text,
    };
  }

  protected buildTranslateLanguageBody(text: string, from: Lang, to: Lang): ITranslateRequest {
    return {
      q: text,
      langpair: `${from}|${to}`,
      markUnknown: 'no',
      prefs: '',
    };
  }

  public async detectLanguage(text: string): Promise<Lang> {
    const { data } = await this.makeRequest<IDetectLanguageRequest>(
      Endpoints.IDENTIFY_LANG,
      this.buildDetectLanguageBody(text),
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [lang] = maxBy(Object.entries(data), ([, value]) => value)!;

    return lang as Lang;
  }

  public async translate(text: string, from: Lang, to: Lang) {
    const { data } = await this.makeRequest<ITranslateResponse>(
      Endpoints.TRANSLATE,
      this.buildTranslateLanguageBody(text, from, to),
    );

    return data.responseData.translatedText;
  }

  public static isBrowser() {
    return typeof window === 'object';
  }

  public static HOST = 'https://apertium.org/apy';
  public static METHOD = 'POST';
}
