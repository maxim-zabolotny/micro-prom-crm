import { Request } from '../request';
import { IProduct, IProductFull, IProductRaw, IProductFullRaw } from './IProduct';
import { IProductRequestOptions } from './IOptions';
export declare type TEntity = IProduct | IProductFull;
export declare type TRawEntity = IProductRaw | IProductFullRaw;
export declare type TGetProductsOptions = Omit<IProductRequestOptions, 'full'>;
export declare class Product extends Request {
    private parseResult;
    getProducts(options?: TGetProductsOptions, full?: false): Promise<IProduct[]>;
    getProducts(options?: TGetProductsOptions, full?: true): Promise<IProductFull[]>;
    private static PATH;
}
