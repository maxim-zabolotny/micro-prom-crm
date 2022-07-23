import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Lang } from '../types/api';
import { IResult } from './IResult';
import { TTranslateResponse } from './IResponse';
import { ITranslateRequestOptions, ITranslateRequestRawOptions } from './IRequest';
export declare class Request {
    protected config: AxiosRequestConfig;
    protected axios: AxiosInstance;
    protected useRandomUserAgent: boolean;
    protected userAgent: string;
    constructor({ config }?: {
        config?: AxiosRequestConfig;
    });
    protected encodeText(text: string): string;
    protected decodeText(text: string): string;
    protected prepareRequestOptions(options: ITranslateRequestOptions): ITranslateRequestRawOptions;
    protected getUserAgent(): string;
    protected parseResult(result: TTranslateResponse, targetLang: Lang): IResult;
    protected makeRequest(options: ITranslateRequestRawOptions): Promise<AxiosResponse<TTranslateResponse>>;
    setDefaultUserAgent(agent: string): void;
    getDefaultUserAgent(): string;
    setUseRandomUserAgent(use: boolean): void;
    translate(text: string, from: Lang, to: Lang): Promise<IResult>;
    static addUserAgents(agents: string[]): void;
    static removeUserAgents(agents: string[]): void;
    static userAgents: string[];
    static HOST: string;
    static METHOD: string;
    static DEFAULT_PARAMS: {
        client: string;
        dt: string[];
        hl: string;
        ie: string;
        oe: string;
    };
    static DEFAULT_HEADERS: {
        origin: string;
        referer: string;
        'user-agent': string;
    };
}
