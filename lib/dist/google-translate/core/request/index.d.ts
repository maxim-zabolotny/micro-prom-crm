import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Lang } from '../types/api';
import { IResult } from './IResult';
import { TTranslateResponse } from './IResponse';
import { ITranslateRequestOptions, ITranslateRequestRawOptions } from './IRequest';
export declare class Request {
    protected config: AxiosRequestConfig;
    protected axios: AxiosInstance;
    protected userAgent: string;
    constructor({ config }?: {
        config?: AxiosRequestConfig;
    });
    protected encodeText(text: string): string;
    protected decodeText(text: string): string;
    protected prepareRequestOptions(options: ITranslateRequestOptions): ITranslateRequestRawOptions;
    protected parseResult(result: TTranslateResponse, targetLang: Lang): IResult;
    protected makeRequest(options: ITranslateRequestRawOptions): Promise<AxiosResponse<TTranslateResponse>>;
    setUserAgent(agent: string): void;
    getUserAgent(): string;
    translate(text: string, from: Lang, to: Lang): Promise<IResult>;
    static HOST: string;
    static METHOD: string;
    static DEFAULT_PARAMS: {
        client: string;
        dt: string;
    };
    static DEFAULT_HEADERS: {
        origin: string;
        referer: string;
        'user-agent': string;
    };
}
