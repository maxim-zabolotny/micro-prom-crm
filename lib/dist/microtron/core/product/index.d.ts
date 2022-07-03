import { Request } from '../request';
import { IProduct, IProductFull, IProductRaw, IProductFullRaw } from './IProduct';
import { IProductRequestOptions } from './IOptions';
import { IResponseRaw } from '../request/IResponse';
export declare type TEntity = IProduct | IProductFull;
export declare type TRawEntity = IProductRaw | IProductFullRaw;
export declare type TGetProductsOptions = Omit<IProductRequestOptions, 'full'>;
export declare class Product extends Request<TEntity[], TRawEntity[]> {
    protected parseResult(data: IResponseRaw<TRawEntity[]>): {
        data: TEntity[];
        timestamp: Date;
        status: boolean;
    };
    getProducts(options?: TGetProductsOptions, full?: false): Promise<IProduct[]>;
    getProducts(options?: TGetProductsOptions, full?: true): Promise<IProductFull[]>;
    static readonly PATH = "products";
}
