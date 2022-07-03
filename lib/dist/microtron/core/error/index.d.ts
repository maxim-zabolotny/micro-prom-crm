import { AxiosRequestConfig } from 'axios';
import { IResponseError } from '../request/IResponse';
export declare class MicroError extends Error {
    readonly timestamp: Date;
    readonly errors: string;
    readonly config: AxiosRequestConfig;
    readonly path: string;
    constructor(response: IResponseError, config: AxiosRequestConfig, path: string);
    static isMicroError(error: unknown): error is MicroError;
}
