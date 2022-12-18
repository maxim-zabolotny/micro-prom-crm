import { Types as MicrotronTypes } from '@lib/microtron';

export interface IProductCostInfo {
  price: number;
  currency: MicrotronTypes.Currency;
  quantity: number;
  rawPrice: number;
  ourPrice: number;
  siteMarkup?: number;
}
