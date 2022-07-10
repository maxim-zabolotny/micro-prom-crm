import { Request } from '../request';
import { TEntity as TProductEntity } from '../product';
import { Lang } from '../types/api';
import { ICategoriesTree, ICategory, ICategoryRaw } from './ICategorie';
import { IResponseRaw } from '../request/IResponse';
import { IProductRequestOptions } from '../product/IOptions';
export declare type TEntity = ICategory;
export declare type TRawEntity = ICategoryRaw;
export declare class Category extends Request<TEntity[], TRawEntity[]> {
    protected parseResult(data: IResponseRaw<TRawEntity[]>): {
        data: ICategoryRaw[];
        timestamp: Date;
        status: boolean;
    };
    getCategories(lang?: Lang): Promise<TEntity[]>;
    getProducts<TProduct extends TProductEntity>(category: Pick<TEntity, 'id'>, options?: Omit<IProductRequestOptions, 'categoryIds'>): Promise<TProduct[]>;
    static buildCategoriesTree(categories: TEntity[]): ICategoriesTree[];
    static readonly PATH = "categories";
}
