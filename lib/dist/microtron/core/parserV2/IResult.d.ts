import { Currency, ProductAvailabilityV2 } from '../types/api';
export declare type TProductSpecifications = Record<string, string>;
export interface ICost {
    price: number;
    currency: Currency;
}
export interface IResultBody {
    name: string;
    description: string;
    brand: string;
    availability: ProductAvailabilityV2;
    cost: ICost;
    specifications: TProductSpecifications;
}
export interface IResult extends IResultBody {
    new: boolean;
    available: boolean;
    url: string;
}
