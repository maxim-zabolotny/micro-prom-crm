import { Lang } from '../types/api';

export interface IProductRequestOptions {
    lang?: Lang;
    // categoryIds?: Array<number>;
    categoryIds?: Array<string>;
    full?: boolean;
    local?: boolean;
}
