/*external modules*/
import _ from 'lodash';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
/*lib*/
/*types*/
import {
  APIErrorType,
  IAPIDefaultError,
  IAPIImportProductsError,
  IAPIProductEditError,
  IAPISaveDeliveryDeclarationError,
  TAPIError,
} from './IError';

/*other*/

export class PromAPIError<IErrorData extends TAPIError> {
  public readonly name: string;

  public readonly type: APIErrorType;
  public readonly message: string;
  public readonly data: IErrorData;

  public readonly timestamp: Date;
  public readonly path: string;

  public readonly config: AxiosRequestConfig;
  public readonly response: AxiosResponse;

  constructor(response: AxiosResponse) {
    const {
      data,
      config,
    } = response;

    // default
    this.name = PromAPIError.name;

    // prom
    const errorData = data as IErrorData;
    const errorMessage = _.get(data, 'error', _.get(data, 'message', ''));

    this.type = PromAPIError.getErrorType(errorData) as APIErrorType;
    this.message = `[${this.name}] Prom API error - ${errorMessage}`;
    this.data = errorData;

    this.timestamp = new Date();
    this.path = `${config.baseURL ?? ''}${config.url ?? ''}`;

    // axios
    this.config = config;
    this.response = response;
  }

  private static errorHasAllKeys(data: object, keys: string[]) {
    return _.every(keys, (key) => (key in data)) && _.isEqual(Object.keys(data).length, keys.length);
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
        return null;
      }
    }
  }
}

/**
 * ----------------------------
 *    1. Default Error
 *      {
 *        "error": "string"
 *      }
 *
 * ----------------------------
 *    2. Product Edit Error
 *      {
 *        "errors": {},
 *        "processed_ids": [
 *          0
 *        ]
 *      }
 *
 * ----------------------------
 *    3. Import Products Error
 *      {
 *        "status": "string",
 *        "message": "string"
 *      }
 *
 * ----------------------------
 *    4. Save Delivery Declaration Error
 *      {
 *        "status": "error",
 *        "message": "Ошибка валидации",
 *        "errors": {
 *          "declaration_id": "Номер декларации должен состоять из цифр"
 *        }
 *      }
 * */
