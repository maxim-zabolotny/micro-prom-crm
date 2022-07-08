import { AxiosRequestConfig, AxiosResponse, AxiosInstance } from 'axios';
import { Lang } from '../types/api';
import { IDetectLanguageRequest, ITranslateRequest, TRequestData } from './IRequest';
import { Endpoints } from './Endpoints';
export declare class Request {
    protected config: AxiosRequestConfig;
    protected axios: AxiosInstance;
    constructor({ config }?: {
        config?: AxiosRequestConfig;
    });
    protected makeRequest<TResult>(resource: Endpoints, body: TRequestData): Promise<AxiosResponse<TResult>>;
    protected buildDetectLanguageBody(text: string): IDetectLanguageRequest;
    protected buildTranslateLanguageBody(text: string, from: Lang, to: Lang): ITranslateRequest;
    detectLanguage(text: string): Promise<Lang>;
    translate(text: string, from: Lang, to: Lang): Promise<string>;
    static isBrowser(): boolean;
    static HOST: string;
    static METHOD: string;
}
