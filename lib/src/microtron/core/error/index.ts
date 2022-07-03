/*external modules*/
import { AxiosRequestConfig } from 'axios';
/*lib*/
/*types*/
import { IResponseError } from '../request/IResponse';
/*other*/

export class MicroError extends Error {
  public readonly timestamp: Date;
  public readonly errors: string;

  public readonly config: AxiosRequestConfig;
  public readonly path: string;

  constructor(response: IResponseError, config: AxiosRequestConfig, path: string) {
    super(response.errors);

    this.timestamp = response.timestamp;
    this.errors = response.errors;

    this.config = config;
    this.path = path;
  }

  public static isMicroError(error: unknown): error is MicroError {
    return error instanceof MicroError;
  }
}
