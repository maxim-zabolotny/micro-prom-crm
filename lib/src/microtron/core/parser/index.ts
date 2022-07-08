/*external modules*/
import _ from 'lodash';
import * as cheerio from 'cheerio';
import axios from 'axios';
/*lib*/
/*types*/
import { IHEADSettingEntity, ISettings } from './ISettings';
/*other*/

export class Parser {
  public readonly htmlPage: string;
  public readonly $root: cheerio.CheerioAPI;

  constructor(htmlPage: string) {
    this.htmlPage = htmlPage;
    this.$root = cheerio.load(htmlPage);
  }

  private parseMetaTags($tags: cheerio.Cheerio<cheerio.Element>, entity: IHEADSettingEntity) {
    const result: Record<string, unknown> = {};

    $tags.each((_i, $el) => {
      const attributes = this.$root($el).attr();
      const attrKey = _.get(attributes, entity.attrKey, '');

      if (attrKey.startsWith(entity.wildcard)) {
        const entityKey = _.find(entity.keys, ({ value }) => attrKey.endsWith(value));
        if (!entityKey) return; // continue

        const content = _.get(attributes, entity.attrValue);
        result[entityKey.alias] = content;
      }
    });

    return result;
  }

  private parseElementText($el: cheerio.Cheerio<cheerio.Element>, replaceSpaces = false) {
    const text = $el
      .text()
      .trim();

    return replaceSpaces ? Parser.replaceMultipleSpaces(text) : text;
  }

  private parseProductDetails($el: cheerio.Cheerio<cheerio.Element>) {
    const result: Record<string, string> = {};

    $el
      .children()
      .each((_i, el) => {
        // 1 CASE: div.detail-row > div.detail-item > div.allocator > p
        // 2 CASE: div.detail-item > div.allocator > p

        const rawValue = this
          .$root(el)
          .find('p')
          .text()
          .trim();

        const dotIndex = rawValue.indexOf(':');

        const key = rawValue.slice(0, dotIndex).trim();
        const value = rawValue.slice(dotIndex + 1).trim();

        result[key] = value;
      });

    return result;
  }

  private parseProductSpecifications($el: cheerio.Cheerio<cheerio.Element>) {
    const result: Record<string, string> = {};

    $el
      .children()
      .each((_i, el) => {
        const children = this.$root(el).children();

        const keyEl = children.first();
        const valueEl = children.last();

        const [key, value] = [keyEl, valueEl]
          .map((targetEl) => targetEl
            .find('p')
            .text()
            .trim());

        result[key] = value;
      });

    return result;
  }

  private getHeadOG($tags: cheerio.Cheerio<cheerio.Element>) {
    return this.parseMetaTags($tags, Parser.SETTINGS.HEAD.OG);
  }

  private getHeadProduct($tags: cheerio.Cheerio<cheerio.Element>) {
    return this.parseMetaTags($tags, Parser.SETTINGS.HEAD.PRODUCT);
  }

  private getHeadBase($tags: cheerio.Cheerio<cheerio.Element>) {
    return this.parseMetaTags($tags, Parser.SETTINGS.HEAD.BASE);
  }

  private getProductName($body: cheerio.Cheerio<cheerio.Element>) {
    const $el = $body.find(Parser.SETTINGS.BODY.NAME.selector);
    return this.parseElementText($el, true);
  }

  private getProductDescription($body: cheerio.Cheerio<cheerio.Element>) {
    const $el = $body.find(Parser.SETTINGS.BODY.DESCRIPTION.selector);
    return this.parseElementText($el, false);
  }

  private getProductDetails($body: cheerio.Cheerio<cheerio.Element>) {
    const $el = $body.find(Parser.SETTINGS.BODY.DETAILS.selector);
    return this.parseProductDetails($el);
  }

  private getProductSpecifications($body: cheerio.Cheerio<cheerio.Element>) {
    const $el = $body.find(Parser.SETTINGS.BODY.SPECIFICATIONS.selector);
    return this.parseProductSpecifications($el);
  }

  public getTitle() {
    const $title = this.$root('title');
    return $title.text().trim();
  }

  public parseHead() {
    const $metaTags = this
      .$root('head')
      .find('meta');

    return {
      og: this.getHeadOG($metaTags),
      product: this.getHeadProduct($metaTags),
      base: this.getHeadBase($metaTags),
    };
  }

  public parseBody() {
    const $body = this.$root('body');

    return {
      name: this.getProductName($body),
      description: this.getProductDescription($body),
      details: this.getProductDetails($body),
      specifications: this.getProductSpecifications($body),
    };
  }

  public parse() {
    return {
      title: this.getTitle(),
      head: this.parseHead(),
      body: this.parseBody(),
    };
  }

  public static async load(link: string) {
    const { data } = await axios.get(link);
    return new Parser(data);
  }

  public static replaceMultipleSpaces(text: string) {
    return text.replace(/\s{2,}/g, ' ');
  }

  public static readonly SETTINGS: ISettings = {
    HEAD: {
      OG: {
        wildcard: 'og:',
        attrKey: 'property',
        attrValue: 'content',
        keys: [
          {
            value: 'locale',
            alias: 'locale',
          },
          {
            value: 'title',
            alias: 'title',
          },
          {
            value: 'description',
            alias: 'description',
          },
          {
            value: 'url',
            alias: 'url',
          },
          {
            value: 'image',
            alias: 'image',
          },
        ],
      },
      PRODUCT: {
        wildcard: 'product:',
        attrKey: 'property',
        attrValue: 'content',
        keys: [
          {
            value: 'brand',
            alias: 'brand',
          },
          {
            value: 'availability',
            alias: 'availability',
          },
          {
            value: 'product:condition',
            alias: 'condition',
          },
          {
            value: 'price:amount',
            alias: 'price',
          },
          {
            value: 'price:currency',
            alias: 'currency',
          },
          {
            value: 'retailer_item_id',
            alias: 'retailerItemId',
          },
        ],
      },
      BASE: {
        wildcard: '',
        attrKey: 'name',
        attrValue: 'content',
        keys: [
          {
            value: 'description',
            alias: 'description',
          },
          {
            value: 'keywords',
            alias: 'keywords',
          },
        ],
      },
    },
    BODY: {
      NAME: {
        selector: 'h1[itemprop="name"]',
      },
      DETAILS: {
        selector: 'div.detail-box',
      },
      DESCRIPTION: {
        selector: 'div[itemprop="description"]',
      },
      SPECIFICATIONS: {
        selector: '#specifications',
      },
    },
  };
}
