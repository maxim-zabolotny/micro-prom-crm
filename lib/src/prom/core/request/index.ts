/*external modules*/
import _ from 'lodash';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import urlJoin from 'url-join';
/*lib*/
/*types*/
import { HttpMethods } from './HttpMethods';
import { ILibraryResponse } from '../types/api';
import { AxiosExtendedError, PromAPIError } from '../error';
import { TObject } from '../types';
/*other*/

export {
  HttpMethods,
};

export abstract class Request {
  protected config: AxiosRequestConfig;
  protected token: string;

  constructor({ token, config }: { token: string, config?: AxiosRequestConfig }) {
    this.token = token;
    this.config = config ?? {};
  }

  public getToken() {
    return this.token;
  }

  public getConfig() {
    return this.config;
  }

  public setConfig(config: AxiosRequestConfig) {
    this.config = config;
    return this;
  }

  public mergeConfig(config: AxiosRequestConfig) {
    _.merge(this.config, config);
    return this;
  }

  public setToken(token: string) {
    this.token = token;
    return this;
  }

  protected abstract buildUrl(path: string | number): string;

  protected async makeRequest<TBody extends object, TParams extends object, TResponse>(
    method: HttpMethods,
    resource: string,
    data?: TBody,
    params?: TParams,
  ): Promise<ILibraryResponse<TResponse>> {
    const path = urlJoin(Request.API_VERSION, resource);

    try {
      const response = await axios({
        ...this.config,
        method,
        data: data ?? {},
        params: params ?? {},
        baseURL: `${Request.HOST}:${Request.PORT}`,
        url: path,
        responseType: 'json',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      if (Request.isErrorCase(response)) {
        throw new PromAPIError(response);
      }

      return {
        response,
        body: response.data,
      };
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        const error = err as TObject.MakeRequired<AxiosError, 'response'>;
        throw new AxiosExtendedError(error);
      }

      throw err;
    }
  }

  public static readonly HOST = 'https://my.prom.ua';
  public static readonly API_VERSION = '/api/v1';
  public static readonly PORT = 443;

  public static isErrorCase(response: AxiosResponse): boolean {
    if (!response.data) return false;

    const errorType = PromAPIError.getErrorType(response.data);
    return Boolean(errorType);
  }
}
