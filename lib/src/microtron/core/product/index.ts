/*external modules*/
import _ from 'lodash'
/*lib*/
import { Request } from '../request/'
/*types*/
import { Currency, Lang } from "../types";
import { IResponse, IResponseRaw } from '../request/IResponse';
import { IProduct, IProductFull, IProductRaw, IProductFullRaw } from './IProduct'
import { IProductRequestOptions } from "./IOptions";

export type TEntity = IProduct | IProductFull;
export type TRawEntity = IProductRaw | IProductFullRaw;

export class Product extends Request {

    private parse(data: IResponseRaw<TRawEntity[]>): IResponse<TEntity[]> {
        const { data: responseData, ...responseFields } = super.parse<TRawEntity[]>(data);

        return {
            ...responseFields,
            data: _.map(
                responseData,
                data => ({
                    ...data,
                    categoryId: Number(data.categoryId),
                    currency: data.currency as Currency
                })
            ) as TEntity[]
        }
    }

    public async getProducts(options?: Omit<IProductRequestOptions, 'full'>, full?: false): Promise<IProduct[]>;
    public async getProducts(options?: Omit<IProductRequestOptions, 'full'>, full?: true): Promise<IProductFull[]>;

    public async getProducts(options?: Omit<IProductRequestOptions, 'full'>, full = false): Promise<TEntity[]> {
        const {
            lang = Lang.UA,
            categoryIds = [],
            local = false,
        } = options;

        try {
            const response = await this.makeRequest<TRawEntity[]>(Product.PATH, {
                lang,
                categoryIds,
                local,
                full,
            })
            return this.parse(response.data).data;
        } catch (error) {
            if(process.env.IS_DEBUG) {
                console.log('Product:error => ', error)
            }

            throw error;
        }
    }

    private static PATH = 'products'
}