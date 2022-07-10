import { Currency, ProductAvailability, ProductCondition } from '../types/api';

// HEAD
export interface IResultHeadOG {
  locale: string;
  title: string;
  description: string;
  url: string;
  image: string;
}

export interface IResultHeadProduct {
  brand: string;
  availability: ProductAvailability;
  condition: ProductCondition;
  price: string;
  currency: Currency;
  retailerItemId: string;
}

export interface IResultHeadBase {
  description: string;
  keywords: string;
}

export type THeadResults = IResultHeadOG | IResultHeadProduct | IResultHeadBase;
export type THeadResultKeys =
  | (keyof IResultHeadOG)
  | (keyof IResultHeadProduct)
  | (keyof IResultHeadBase);

export interface IResultHead {
  og: IResultHeadOG;
  product: IResultHeadProduct;
  base: IResultHeadBase;
}

// BODY
export type TProductDetails = Record<string, string>
export type TProductSpecifications = Record<string, string>

export interface IResultBody {
  name: string;
  description: string;
  details: TProductDetails;
  specifications: TProductSpecifications;
}

// RESULT
export interface IResult {
  new: boolean;
  title: string;
  head: IResultHead;
  body: IResultBody;
}
