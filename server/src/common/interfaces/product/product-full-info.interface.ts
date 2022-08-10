import { ParserV2, Product } from '@lib/microtron';

export interface IProductFullInfo
  extends Omit<Product.IProductFull, 'RRP' | 'description'> {
  parse: Omit<ParserV2.IResult, 'name' | 'brand' | 'availability' | 'url'>;
  translate: Pick<ParserV2.IResult, 'name' | 'description'>;
}
