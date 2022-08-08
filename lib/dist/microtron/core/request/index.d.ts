import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { TObject } from '../types';
import { IResponse, IResponseError, IResponseErrorRaw, IResponseRaw } from './IResponse';
declare type TUnknownRec = TObject.TUnknownRec;
export declare abstract class Request<TInstance = unknown, TRawInstance = unknown> {
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
    protected abstract parseResult(data: IResponseRaw<TRawInstance>): IResponse<TInstance>;
    protected parseData(data: IResponseRaw<TRawInstance>): IResponse<TRawInstance>;
    protected parseError(data: IResponseErrorRaw): IResponseError;
    protected makeRequest(resource: string, data?: TUnknownRec): Promise<AxiosResponse<IResponseRaw<TRawInstance> | IResponseError>>;
    static HOST: string;
    static METHOD: string;
    static isErrorCase(response: object): response is IResponseErrorRaw;
    static isBasicCase<TEntity>(response: object): response is IResponseRaw<TEntity>;
    protected static requestWrapper<TInstance, TRawInstance, TEntity extends {
        name: string;
        readonly PATH: string;
    }>(entity: TEntity, instance: Request<TInstance, TRawInstance>, data?: TUnknownRec): Promise<TInstance>;
}
export {};
