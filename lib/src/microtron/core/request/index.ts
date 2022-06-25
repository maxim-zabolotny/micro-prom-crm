/*external modules*/
import _ from 'lodash';
import moment from 'moment';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import urlJoin from 'url-join';
/*lib*/
/*types*/
import { TObject } from '../types';
import { IResponse, IResponseRaw } from './IResponse';
/*other*/

type TUnknownRec = TObject.TUnknownRec;

export class Request {
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

  protected parse<TEntity>(
    data: IResponseRaw<unknown>,
  ): IResponse<TEntity> {
    const date = moment(data.timestamp, 'DD.MM.YYYY HH:mm:ss').toDate();
    return {
      timestamp: date,
      status: data.status,
      data: data.data as TEntity,
    };
  }

  protected async makeRequest<TEntity>(
    resource: string,
    data: TUnknownRec = {},
  ): Promise<AxiosResponse<IResponseRaw<TEntity>>> {
    const path = urlJoin(Request.HOST, resource);
    const body = _.merge({}, data, { token: this.token });

    return axios({
      method: Request.METHOD,
      url: path,
      data: body,
    });
  }

  public static HOST = 'https://api.microtron.ua';
  public static METHOD = 'POST';
}
