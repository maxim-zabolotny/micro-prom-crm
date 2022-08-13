import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { HttpMethods } from './HttpMethods';
import { ILibraryResponse } from '../types/api';
export { HttpMethods, };
export declare abstract class Request {
    protected config: AxiosRequestConfig;
    protected token: string;
    constructor({ token, config }: {
        token: string;
        config?: AxiosRequestConfig;
    });
    getToken(): string;
    getConfig(): AxiosRequestConfig<any>;
    setConfig(config: AxiosRequestConfig): this;
    mergeConfig(config: AxiosRequestConfig): this;
    setToken(token: string): this;
    protected abstract buildUrl(path: string | number): string;
    protected makeRequest<TBody extends object, TParams extends object, TResponse>(method: HttpMethods, resource: string, data?: TBody, params?: TParams): Promise<ILibraryResponse<TResponse>>;
    static readonly HOST = "https://my.prom.ua";
    static readonly API_VERSION = "/api/v1";
    static readonly PORT = 443;
    static isErrorCase(response: AxiosResponse): boolean;
}
