import { AxiosError } from 'axios';
export declare enum APIErrorType {
    Default = "Default",
    ProductEdit = "ProductEdit",
    ImportProducts = "ImportProducts",
    SaveDeliveryDeclaration = "SaveDeliveryDeclaration"
}
export interface IAPIDefaultError {
    error: string;
}
export interface IAPIProductEditError {
    errors: Record<string, unknown>;
    processed_ids: number[];
}
export interface IAPIImportProductsError {
    status: string;
    message: string;
}
export interface IAPISaveDeliveryDeclarationError {
    status: 'error';
    message: string;
    errors: Record<string, unknown>;
}
export declare type TAPIError = IAPIDefaultError | IAPIProductEditError | IAPIImportProductsError | IAPISaveDeliveryDeclarationError;
export declare type TErrorCode = Exclude<keyof typeof AxiosError, 'prototype' | 'captureStackTrace' | 'prepareStackTrace' | 'stackTraceLimit'>;
