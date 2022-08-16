import * as _ from 'lodash';
import { ParserV2 } from '@lib/microtron';

export class ProductsParseMap extends Map<string, ParserV2.IResult | null> {
  constructor(
    entries?: readonly (readonly [string, ParserV2.IResult | null])[] | null,
  ) {
    if (_.isEmpty(entries)) {
      super();
      return;
    }

    super(
      entries.map(([url, parseResult]) => [
        ProductsParseMap.buildUnionProductUrl(url),
        parseResult,
      ]),
    );
  }

  has(url: string) {
    const unionUrl = ProductsParseMap.buildUnionProductUrl(url);
    return super.has(unionUrl);
  }

  get(url: string) {
    const unionUrl = ProductsParseMap.buildUnionProductUrl(url);
    return super.get(unionUrl);
  }

  set(url: string, value: ParserV2.IResult | null) {
    const unionUrl = ProductsParseMap.buildUnionProductUrl(url);
    return super.set(unionUrl, value);
  }

  delete(url: string) {
    const unionUrl = ProductsParseMap.buildUnionProductUrl(url);
    return super.delete(unionUrl);
  }

  public static buildUnionProductUrl(url: string) {
    const keyValue = 'microtron.ua';
    const keyValueIndex = url.indexOf(keyValue);

    if (keyValueIndex < 0) {
      return url;
    }

    return url.slice(keyValueIndex + keyValue.length);
  }
}
