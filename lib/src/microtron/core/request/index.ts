/*external modules*/
import _ from 'lodash';
import moment from 'moment';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import urlJoin from 'url-join';
/*lib*/
import { MicroError } from '../error';
/*types*/
import { TObject } from '../types';
import {
  IResponse, IResponseError, IResponseErrorRaw, IResponseRaw,
} from './IResponse';
/*other*/

type TUnknownRec = TObject.TUnknownRec;

export abstract class Request<TInstance = unknown, TRawInstance = unknown> {
  protected config: AxiosRequestConfig;
  protected token: string;
  protected force: boolean;

  constructor({ token, config }: { token: string, config?: AxiosRequestConfig }) {
    this.token = token;
    this.config = config ?? {};
    this.force = true;
  }

  public getToken() {
    return this.token;
  }

  public getConfig() {
    return this.config;
  }

  public getForce() {
    return this.force;
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

  public changeForce(force: boolean) {
    this.force = force;
    return this;
  }

  protected abstract parseResult(data: IResponseRaw<TRawInstance>): IResponse<TInstance>;

  protected parseData(data: IResponseRaw<TRawInstance>): IResponse<TRawInstance> {
    const date = moment(data.timestamp, 'DD.MM.YYYY HH:mm:ss').toDate();
    return {
      timestamp: date,
      status: data.status,
      data: data.data,
    };
  }

  protected parseError(data: IResponseErrorRaw): IResponseError {
    const date = moment(data.timestamp, 'DD.MM.YYYY HH:mm:ss').toDate();
    return {
      timestamp: date,
      status: data.status,
      errors: data.errors,
    };
  }

  protected async makeRequest(
    resource: string,
    data: TUnknownRec = {},
  ): Promise<AxiosResponse<IResponseRaw<TRawInstance> | IResponseError>> {
    const path = urlJoin(Request.HOST, resource);
    const body = _.merge({}, data, { token: this.token });

    return axios({
      ...this.config,
      method: Request.METHOD,
      url: path,
      data: body,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
  }

  public static HOST = 'https://api.microtron.ua';
  public static METHOD = 'POST';

  public static isErrorCase(response: object): response is IResponseErrorRaw {
    return 'errors' in response;
  }

  public static isBasicCase<TEntity>(response: object): response is IResponseRaw<TEntity> {
    return 'data' in response;
  }

  protected static async requestWrapper<TInstance,
    TRawInstance,
    TEntity extends { name: string, readonly PATH: string },
    >(
    entity: TEntity,
    instance: Request<TInstance, TRawInstance>,
    data: TUnknownRec = {},
  ): Promise<TInstance> {
    try {
      const response = await instance.makeRequest(entity.PATH, data);

      if (Request.isErrorCase(response.data)) {
        const errorData = instance.parseError(response.data);
        throw new MicroError(errorData, entity.PATH, response);
      }

      if (Request.isBasicCase<TRawInstance>(response.data)) {
        return instance.parseResult(response.data).data;
      }

      throw new Error('Unknown response case!');
    } catch (error) {
      if (process.env.IS_DEBUG) {
        console.log(`${entity.name}:error => `, error);
      }

      throw error;
    }
  }
}
