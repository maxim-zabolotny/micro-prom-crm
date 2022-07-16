import { Currency, ProductAvailabilityV2 } from '../types/api';

export type TProductSpecifications = Record<string, string>

export interface ICost {
  price: number;
  currency: Currency
}

export interface IResultBody {
  name: string;
  description: string;
  brand: string;
  availability: ProductAvailabilityV2
  cost: ICost;
  specifications: TProductSpecifications;
}

// RESULT
export interface IResult extends IResultBody {
  new: boolean;
  available: boolean;
  url: string;
}
