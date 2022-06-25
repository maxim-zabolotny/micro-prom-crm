import { Lang } from '../types/api';

export interface IProductRequestOptions {
    lang?: Lang;
    categoryIds?: Array<number>;
    full?: boolean;
    local?: boolean;
}
