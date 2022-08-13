import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { APIErrorType, TAPIError } from './IError';
export declare class PromAPIError<IErrorData extends TAPIError> {
    readonly name: string;
    readonly type: APIErrorType;
    readonly message: string;
    readonly data: IErrorData;
    readonly timestamp: Date;
    readonly path: string;
    readonly config: AxiosRequestConfig;
    readonly response: AxiosResponse;
    constructor(response: AxiosResponse);
    private static validateError;
    static isPromError<IAPIError extends TAPIError>(error: unknown): error is PromAPIError<IAPIError>;
    static getErrorType(data: TAPIError): APIErrorType | null;
}
