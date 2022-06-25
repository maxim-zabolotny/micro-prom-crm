import { Request } from '../request';
import { TEntity as TProductEntity } from '../product';
import { Lang } from '../types/api';
import { ICategory, ICategoryRaw, ICategoriesTree } from './ICategorie';
import { IProductRequestOptions } from '../product/IOptions';
export declare type TEntity = ICategory;
export declare type TRawEntity = ICategoryRaw;
export declare class Category extends Request {
    private parseResult;
    getCategories(lang?: Lang): Promise<TEntity[]>;
    getProducts<TProduct extends TProductEntity>(category: Pick<TEntity, 'id'>, options?: Omit<IProductRequestOptions, 'categoryIds'>): Promise<TProduct[]>;
    static buildCategoriesTree(categories: TEntity[]): ICategoriesTree[];
    private static PATH;
}
