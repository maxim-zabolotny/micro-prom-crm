import { AxiosResponse } from 'axios';
import { IResponseError } from '../request/IResponse';
export declare type TMicroErrorResponse = Pick<AxiosResponse, 'status' | 'statusText' | 'headers' | 'config'>;
export declare class MicroError {
    readonly name: string;
    readonly timestamp: Date;
    readonly errors: string;
    readonly path: string;
    readonly response: TMicroErrorResponse;
    constructor(data: IResponseError, path: string, response: TMicroErrorResponse);
    static isMicroError(error: unknown): error is MicroError;
}
