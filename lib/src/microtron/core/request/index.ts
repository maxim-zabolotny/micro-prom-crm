/*external modules*/
import _ from 'lodash';
import moment from 'moment';
import axios, { Axios, AxiosRequestConfig, AxiosResponse } from 'axios';
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
  protected axios: Axios;

  protected token: string;
  protected force: boolean;

  constructor({ token, config }: { token: string, config?: AxiosRequestConfig }) {
    this.config = config ?? {};

    this.axios = axios.create();
    this.axios.interceptors.response.use(
      (response) => response,
      this.resolveRequestError(),
    );

    this.token = token;
    this.force = true;
  }

  private resolveRequestError() {
    const timeToSleep = 1000 * 60;

    return async (error: any) => {
      if (
        error.code === 'EAI_AGAIN'
        || error.message?.includes('getaddrinfo')
      ) {
        console.error('A temporary failure in name resolution:', {
          code: error.code,
          message: error.message,
        });

        console.log('Sleep and repeat request:', {
          timeToSleep: timeToSleep / 1000,
        });

        await new Promise((resolve) => {
          setTimeout(resolve, timeToSleep);
        });

        return this.axios.request(error.config);
      }

      return Promise.reject(error);
    };
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

    return this.axios.request({
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

      if (!_.isObject(response.data)) {
        switch (true) {
          case (_.isString(response.data) && _.isEmpty(response.data)): {
            // NOTE: If Microtron server is disabled we receive such response: { data: '' }

            const error = new Error('Microtron Error: Server is disabled') as Record<string, any>;
            error.timestamp = moment(new Date(), 'DD.MM.YYYY HH:mm:ss').toDate();
            error.description = '!!! Microtron server is disabled !!!';
            error.url = response.config.url;
            error.timeToSleep = 1000 * 60 * 3;

            console.error('!!! Microtron server disabled !!!');
            console.log('Sleep:', {
              timeToSleep: error.timeToSleep / 1000,
            });

            await new Promise((resolve) => {
              setTimeout(resolve, error.timeToSlee);
            });

            throw error;
          }
          default: {
            break;
          }
        }
      }

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
