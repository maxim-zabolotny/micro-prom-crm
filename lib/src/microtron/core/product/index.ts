/*external modules*/
import _ from 'lodash';
/*lib*/
import { Request } from '../request';
/*types*/
import { Currency, Lang } from '../types/api';
import {
  IProduct, IProductFull, IProductRaw, IProductFullRaw,
} from './IProduct';
import { IProductRequestOptions } from './IOptions';
import { IResponse, IResponseRaw } from '../request/IResponse';
/*other*/

export type TEntity = IProduct | IProductFull;
export type TRawEntity = IProductRaw | IProductFullRaw;

export type TGetProductsOptions = Omit<IProductRequestOptions, 'full'>;

export class Product extends Request<TEntity[], TRawEntity[]> {
  protected parseResult(data: IResponseRaw<TRawEntity[]>) {
    const { data: responseData, ...responseFields } = super.parseData(data);

    return {
      ...responseFields,
      data: _.map(
        responseData,
        (productData) => ({
          ...productData,
          categoryId: Number(productData.categoryId),
          currency: productData.currency as Currency,
        }),
      ) as TEntity[],
    };
  }

  public async getProducts(options?: TGetProductsOptions, full?: false): Promise<IProduct[]>;
  public async getProducts(options?: TGetProductsOptions, full?: true): Promise<IProductFull[]>;

  public async getProducts(options: TGetProductsOptions = {}, full = false): Promise<TEntity[]> {
    const {
      lang = Lang.UA,
      categoryIds = [],
      local = false,
    } = options;

    try {
      const response = await this.makeRequest(Product.PATH, {
        lang,
        categoryIds,
        local,
        full,
      });
      return this.parseResult(response.data).data;
    } catch (error) {
      if (process.env.IS_DEBUG) {
        console.log('Product:error => ', error);
      }

      throw error;
    }
  }

  private static PATH = 'products';
}
