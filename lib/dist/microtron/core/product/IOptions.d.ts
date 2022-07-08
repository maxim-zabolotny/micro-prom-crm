import { Lang } from '../types/api';
export interface IProductRequestOptions {
    lang?: Lang;
    categoryIds?: Array<string>;
    full?: boolean;
    local?: boolean;
}
