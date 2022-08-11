/*external modules*/
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
/*lib*/
/*types*/
import { TErrorCode } from './IError';
import { TObject } from '../types';

/*other*/

export class AxiosExtendedError {
  public readonly name: string;

  public readonly message: string;
  public readonly data: string | Record<string, unknown>;

  public readonly timestamp: Date;
  public readonly path: string;

  public readonly code?: TErrorCode;
  public readonly statusCode: number;
  public readonly statusText: string;
  public readonly config: AxiosRequestConfig;
  public readonly response: AxiosResponse;

  constructor(axiosError: TObject.MakeRequired<AxiosError, 'response'>) {
    const { code, response } = axiosError;
    const {
      status,
      statusText,
      data,
      config,
    } = response;

    // default
    this.name = AxiosExtendedError.name;

    this.message = `[${this.name}] Prom API error - [${status}] ${statusText}`;
    this.data = data as string | Record<string, unknown>;

    this.timestamp = new Date();
    this.path = `${config.baseURL ?? ''}${config.url ?? ''}`;

    // axios
    this.code = code as TErrorCode;
    this.statusCode = status;
    this.statusText = statusText;
    this.config = config;
    this.response = response;
  }

  public static isAxiosExtendedError(
    error: unknown,
  ): error is AxiosExtendedError {
    return error instanceof AxiosExtendedError;
  }
}
