import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { TErrorCode } from './IError';
import { TObject } from '../types';
export declare class AxiosExtendedError {
    readonly name: string;
    readonly message: string;
    readonly data: string | Record<string, unknown>;
    readonly timestamp: Date;
    readonly path: string;
    readonly code?: TErrorCode;
    readonly statusCode: number;
    readonly statusText: string;
    readonly config: AxiosRequestConfig;
    readonly response: AxiosResponse;
    constructor(axiosError: TObject.MakeRequired<AxiosError, 'response'>);
    static isAxiosExtendedError(error: unknown): error is AxiosExtendedError;
}
