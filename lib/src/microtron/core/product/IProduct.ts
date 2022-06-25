import { Currency } from '../types/api';

export interface IProductRaw {
    id: number;
    categoryId: string;

    name: string;
    vendorCode: string; // Артикль

    currency: string;
    price: number;
    quantity?: number;

    price_s?: number; // Цена неоф.
    quantity_s?: number; // Остаток неоф.
    RRP: string; // РРЦ (грн)

    brand: string;
    warranty: number;

    UKTZED: string;
}

export interface IProductFullRaw extends IProductRaw {
    url: string;
    images: string[];
    description: string; // с тегами HTML
}

export interface IProduct extends Omit<IProductRaw, 'categoryId' | 'currency'> {
    categoryId: number;
    currency: Currency;
}

export interface IProductFull extends IProduct {
    url: string;
    images: string[];
    description: string; // с тегами HTML
}
