/*external modules*/
import * as cheerio from 'cheerio';
import axios from 'axios';
/*lib*/
/*types*/
import { Currency, ProductAvailabilityV2 } from '../types/api';
import {
  ICost, IResult, IResultBody, TProductSpecifications,
} from './IResult';
import { ISettings } from './ISettings';
/*other*/

export type TCheerioEl = cheerio.Cheerio<cheerio.Element>;

export {
  IResult,
  IResultBody,
  ICost,
  TProductSpecifications,
};

const localAxios = axios.create();
localAxios.interceptors.response.use(
  (response) => response,
  async (error: any) => {
    if (
      error.code === 'EAI_AGAIN'
      || error.message?.includes('getaddrinfo')
    ) {
      const timeToSleep = 1000 * 60;

      console.error('A temporary failure in name resolution:', {
        code: error.code,
        message: error.message,
      });

      console.log('Sleep and repeat request:', {
        timeToSleep: timeToSleep / 1000,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, timeToSleep);
      });

      return localAxios.request(error.config);
    }

    return Promise.reject(error);
  },
);

export class ParserV2 {
  public readonly htmlPage: string;
  public readonly $root: cheerio.CheerioAPI;
  public readonly link: string;

  constructor(htmlPage: string, link: string) {
    this.link = link;
    this.htmlPage = htmlPage;
    this.$root = cheerio.load(htmlPage);
  }

  private parseElementText($el: TCheerioEl, replaceSpaces = false): string {
    const text = $el
      .text()
      .trim();

    return replaceSpaces ? ParserV2.replaceMultipleSpaces(text) : text;
  }

  private parseProductSpecifications($el: TCheerioEl): TProductSpecifications {
    const result: TProductSpecifications = {};

    $el
      .children()
      .not(ParserV2.SETTINGS.SPECIFICATIONS.tableTitle)
      .each((_i, el) => {
        const children = this
          .$root(el)
          .children();

        const keyEl = children.first();
        const valueEl = children.last();

        const [key, value] = [keyEl, valueEl]
          .map((targetEl) => targetEl
            .text()
            .trim());

        result[key] = value;
      });

    return result;
  }

  private getProductName($body: TCheerioEl): string {
    const $el = $body.find(ParserV2.SETTINGS.NAME.selector);
    return this.parseElementText($el, true);
  }

  private getProductDescription($body: TCheerioEl): string {
    const $el = $body.find(ParserV2.SETTINGS.DESCRIPTION.selector);
    return this.parseElementText($el, false);
  }

  private getProductBrand($body: TCheerioEl): string {
    const $el = $body.find(ParserV2.SETTINGS.BRAND.selector);
    return this.parseElementText($el, false);
  }

  private getProductAvailability($body: TCheerioEl): ProductAvailabilityV2 {
    const $el = $body.find(ParserV2.SETTINGS.AVAILABILITY.selector);
    return this.parseElementText($el, false) as ProductAvailabilityV2;
  }

  private getProductCost($body: TCheerioEl): ICost {
    const $el = $body.find(ParserV2.SETTINGS.PRICE.selector);
    const text = this.parseElementText($el, false);

    const currencyIndex = text.indexOf('грн');

    const priceText = text
      .slice(0, currencyIndex)
      .replace(/\s/g, '');
    const price = parseFloat(priceText);

    return {
      price,
      currency: Currency.UAH,
    };
  }

  private getProductSpecifications($body: TCheerioEl): TProductSpecifications {
    const $el = $body.find(ParserV2.SETTINGS.SPECIFICATIONS.selector);
    return this.parseProductSpecifications($el);
  }

  public parseBody(): IResultBody {
    const $body = this.$root('body');

    return {
      name: this.getProductName($body),
      description: this.getProductDescription($body),
      brand: this.getProductBrand($body),
      availability: this.getProductAvailability($body),
      cost: this.getProductCost($body),
      specifications: this.getProductSpecifications($body),
    };
  }

  public parse(): IResult {
    const parseResult = this.parseBody();

    return {
      ...parseResult,
      new: ParserV2.isNewProduct(parseResult.name),
      available: ParserV2.isAvailable(parseResult.availability),
      url: this.link,
    };
  }

  public static async load(link: string) {
    const { data } = await localAxios.get(link);
    return new ParserV2(data, link);
  }

  public static replaceMultipleSpaces(text: string) {
    return text.replace(/\s{2,}/g, ' ');
  }

  public static isUsedProduct(productName: string) {
    return (productName.startsWith('Б/У') || productName.startsWith('Б/В'));
  }

  public static isNewProduct(productName: string) {
    return !this.isUsedProduct(productName);
  }

  public static isAvailable(productAvailability: ProductAvailabilityV2) {
    return [
      ProductAvailabilityV2.InStockUA,
      ProductAvailabilityV2.InStockRU,
    ].includes(productAvailability);
  }

  public static isNotAvailable(productAvailability: ProductAvailabilityV2) {
    return [
      ProductAvailabilityV2.OutOfStockUA,
      ProductAvailabilityV2.OutOfStockRU,
    ].includes(productAvailability);
  }

  public static readonly SETTINGS: ISettings = {
    NAME: {
      selector: 'div.rm-product-title.order-1.order-md-0',
    },
    DESCRIPTION: {
      selector: '#product_description',
    },
    BRAND: {
      selector: '#product > div > div.rm-product-center-info > div:nth-child(1) > span:nth-child(2) > a',
    },
    AVAILABILITY: {
      selector: '.rm-module-stock',
    },
    PRICE: {
      selector: '.rm-product-center-price',
    },
    SPECIFICATIONS: {
      selector: '#product_attributes > div',
      tableTitle: '.rm-product-tabs-attributtes-list-title',
    },
  };
}
