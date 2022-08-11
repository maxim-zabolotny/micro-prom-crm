/*external modules*/
import { AxiosError } from 'axios';
/*other*/

// ENUMS
export enum APIErrorType {
  Unknown = 'Unknown',
  Default = 'Default',
  ProductEdit = 'ProductEdit',
  ImportProducts = 'ImportProducts',
  SaveDeliveryDeclaration = 'SaveDeliveryDeclaration',
}

// INTERFACES
export interface IAPIUnknownError extends Record<string, unknown> {
}

export interface IAPIDefaultError {
  error: string;
}

export interface IAPIProductEditError {
  errors: Record<string, unknown>;
  processed_ids: number;
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

// TYPES
export type TAPIError =
  | IAPIUnknownError
  | IAPIDefaultError
  | IAPIProductEditError
  | IAPIImportProductsError
  | IAPISaveDeliveryDeclarationError;

export type TErrorCode = Exclude<keyof typeof AxiosError, 'prototype' | 'captureStackTrace' | 'prepareStackTrace' | 'stackTraceLimit'>;
