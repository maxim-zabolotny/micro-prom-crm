/*external modules*/
import _ from 'lodash';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
/*lib*/
/*types*/
import {
  APIErrorType,
  IAPIDefaultError,
  IAPIImportProductsError,
  IAPIProductEditError,
  IAPISaveDeliveryDeclarationError,
  IAPIUnknownError,
  TAPIError,
  TErrorCode,
} from './IError';
import { TObject } from '../types';
/*other*/

export {
  APIErrorType,
  TAPIError,
  TErrorCode,
  IAPIUnknownError,
  IAPIDefaultError,
  IAPIProductEditError,
  IAPIImportProductsError,
  IAPISaveDeliveryDeclarationError,
};

export class PromAPIError<IErrorData extends TAPIError> {
  public readonly name: string;

  public readonly type: APIErrorType;
  public readonly message: string;
  public readonly data: IErrorData;

  public readonly timestamp: Date;
  public readonly path: string;

  public readonly code?: TErrorCode;
  public readonly statusCode: number;
  public readonly statusText: string;
  public readonly config: AxiosRequestConfig;
  public readonly response: AxiosResponse;

  constructor(axiosError: TObject.MakeRequired<AxiosError, 'response'>) {
    const { code, response } = axiosError;
    const {
      status,
      statusText,
      data,
      config,
    } = response;

    // default
    this.name = PromAPIError.name;

    // prom
    const errorData = _.isObject(data) ? data as IErrorData : {} as IErrorData;
    const errorMessage = _.get(data, 'error', _.get(data, 'message', statusText));

    this.type = PromAPIError.getErrorType(errorData);
    this.message = `Prom API error - [${status}] ${errorMessage}`;
    this.data = errorData;

    this.timestamp = new Date();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.path = config.baseURL! + config.url!;

    // axios
    this.code = code as TErrorCode;
    this.statusCode = status;
    this.statusText = statusText;
    this.config = config;
    this.response = response;
  }

  private static errorHasAllKeys(data: object, keys: string[]) {
    return _.every(keys, (key) => (key in data));
  }

  public static isPromError<IAPIError extends TAPIError>(
    error: unknown,
  ): error is PromAPIError<IAPIError> {
    return error instanceof PromAPIError;
  }

  public static getErrorType(data: TAPIError) {
    const defaultKeys: Array<keyof IAPIDefaultError> = ['error'];
    const productEditKeys: Array<keyof IAPIProductEditError> = ['errors', 'processed_ids'];
    const importProductsKeys: Array<keyof IAPIImportProductsError> = ['status', 'message'];
    const saveDeliveryDeclarationKeys: Array<keyof IAPISaveDeliveryDeclarationError> = ['status', 'message', 'errors'];

    switch (true) {
      case (this.errorHasAllKeys(data, saveDeliveryDeclarationKeys)): {
        return APIErrorType.SaveDeliveryDeclaration;
      }
      case (this.errorHasAllKeys(data, importProductsKeys)): {
        return APIErrorType.ImportProducts;
      }
      case (this.errorHasAllKeys(data, productEditKeys)): {
        return APIErrorType.ProductEdit;
      }
      case (this.errorHasAllKeys(data, defaultKeys)): {
        return APIErrorType.Default;
      }
      default: {
        return APIErrorType.Unknown;
      }
    }
  }
}

/**
 * ----------------------------
 *    1. Unknown Error
 *      {
 *        [key: string]: unknown
 *      }
 *
 * ----------------------------
 *    2. Default Error
 *      {
 *        "error": "string"
 *      }
 *
 * ----------------------------
 *    3. Product Edit Error
 *      {
 *        "errors": {},
 *        "processed_ids": [
 *          0
 *        ]
 *      }
 *
 * ----------------------------
 *    4. Import Products Error
 *      {
 *        "status": "string",
 *        "message": "string"
 *      }
 *
 * ----------------------------
 *    5. Save Delivery Declaration Error
 *      {
 *        "status": "error",
 *        "message": "Ошибка валидации",
 *        "errors": {
 *          "declaration_id": "Номер декларации должен состоять из цифр"
 *        }
 *      }
 * */
