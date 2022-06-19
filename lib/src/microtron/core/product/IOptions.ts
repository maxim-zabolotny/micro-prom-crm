import { Lang } from '../types';

export interface IProductRequestOptions {
    lang?: Lang;
    categoryIds?: Array<number>;
    full?: boolean;
    local?: boolean;
}