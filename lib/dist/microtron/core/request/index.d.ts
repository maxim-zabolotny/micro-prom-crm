import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { TObject } from '../types';
import { IResponse, IResponseRaw } from './IResponse';
declare type TUnknownRec = TObject.TUnknownRec;
export declare class Request {
    protected config: AxiosRequestConfig;
    protected token: string;
    protected force: boolean;
    constructor({ token, config }: {
        token: string;
        config?: AxiosRequestConfig;
    });
    getToken(): string;
    getConfig(): AxiosRequestConfig<any>;
    getForce(): boolean;
    setConfig(config: AxiosRequestConfig): this;
    mergeConfig(config: AxiosRequestConfig): this;
    setToken(token: string): this;
    changeForce(force: boolean): this;
    protected parse<TEntity>(data: IResponseRaw<unknown>): IResponse<TEntity>;
    protected makeRequest<TEntity>(resource: string, data?: TUnknownRec): Promise<AxiosResponse<IResponseRaw<TEntity>>>;
    static HOST: string;
    static METHOD: string;
}
export {};
