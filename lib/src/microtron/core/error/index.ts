/*external modules*/
import _ from 'lodash';
import { AxiosResponse } from 'axios';
/*lib*/
/*types*/
import { IResponseError } from '../request/IResponse';
/*other*/

export type TMicroErrorResponse = Pick<AxiosResponse, 'status' | 'statusText' | 'headers' | 'config'>

export class MicroError {
  public readonly name: string;

  public readonly timestamp: Date;
  public readonly errors: string;
  public readonly path: string;

  public readonly response: TMicroErrorResponse;

  constructor(data: IResponseError, path: string, response: TMicroErrorResponse) {
    this.name = MicroError.name;

    this.timestamp = data.timestamp;
    this.errors = data.errors;
    this.path = path;

    this.response = _.pick(response, ['status', 'statusText', 'headers', 'config']);
  }

  public static isMicroError(error: unknown): error is MicroError {
    return error instanceof MicroError;
  }
}
