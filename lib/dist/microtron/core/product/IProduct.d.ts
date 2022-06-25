import { Currency } from '../types/api';
export interface IProductRaw {
    id: number;
    categoryId: string;
    name: string;
    vendorCode: string;
    currency: string;
    price: number;
    quantity?: number;
    price_s?: number;
    quantity_s?: number;
    RRP: string;
    brand: string;
    warranty: number;
    UKTZED: string;
}
export interface IProductFullRaw extends IProductRaw {
    url: string;
    images: string[];
    description: string;
}
export interface IProduct extends Omit<IProductRaw, 'categoryId' | 'currency'> {
    categoryId: number;
    currency: Currency;
}
export interface IProductFull extends IProduct {
    url: string;
    images: string[];
    description: string;
}
