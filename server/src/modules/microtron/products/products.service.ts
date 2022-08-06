import * as _ from 'lodash';
import { promises as fs } from 'fs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataUtilsHelper, TimeHelper } from '@common/helpers';
import MicrotronAPI, { ParserV2, Product, Types } from '@lib/microtron';
import { TranslateProductDto } from './dto/translate-product.dto';
import { TranslateService } from '../../translate/translate.service';
import {
  Request as GoogleTranslate,
  Types as GoogleTranslateTypes,
} from '@lib/google-translate';
import { ITranslatedProduct } from '@common/interfaces/product';

type IProductFull = Product.IProductFull;
type IProductRequestOptions = Product.IProductRequestOptions;

type IParseResult = ParserV2.IResult;

export type TLoadProductsResult = Record<string, IProductFull[]>;
export type TProductsCache = Map<string, IProductFull[]>;
export type TProductsParseCache = Map<string, IParseResult>;

@Injectable()
export class MicrotronProductsService {
  private readonly logger = new Logger(this.constructor.name);

  private readonly productsAPI: Product.Product;
  private readonly productsAPIDefaultOptions: IProductRequestOptions;

  private productsCache: TProductsCache = new Map();
  private productsParseCache: TProductsParseCache = new Map();

  constructor(
    private configService: ConfigService,
    private dataUtilHelper: DataUtilsHelper,
    private timeHelper: TimeHelper,
    private translateService: TranslateService,
  ) {
    this.productsAPI = new MicrotronAPI.Product({
      token: configService.get('tokens.microtron'),
    });
    this.productsAPIDefaultOptions = {
      local: true,
      lang: Types.Lang.UA,
    };

    // TODO: get all products by all categories and run parsing
  }

  private retrieveProductsFromCache(
    categoryIds: string[],
  ): TLoadProductsResult {
    if (_.isEmpty(categoryIds)) return {};

    return Object.fromEntries(
      _.map(categoryIds, (categoryId) => {
        return [categoryId, this.productsCache.get(categoryId)];
      }),
    );
  }

  private async retrieveProductsFromAPI(
    categoryIds: string[],
  ): Promise<TLoadProductsResult> {
    if (_.isEmpty(categoryIds)) return {};

    try {
      const products = await this.productsAPI.getProducts(
        {
          ...this.productsAPIDefaultOptions,
          categoryIds,
        },
        true,
      );

      const groupedProducts = _.groupBy(products, 'categoryId');
      const productCategoryIds = Object.keys(groupedProducts);

      const allCategoryIds = _.uniq([...categoryIds, ...productCategoryIds]);
      _.forEach(allCategoryIds, (categoryId) => {
        if (!productCategoryIds.includes(categoryId)) {
          groupedProducts[categoryId] = [];
        }

        this.productsCache.set(categoryId, groupedProducts[categoryId]);
      });

      this.logger.debug('Loaded categories result:', {
        passed: categoryIds,
        loaded: productCategoryIds,
        all: allCategoryIds,
      });

      return groupedProducts;
    } catch (err: unknown) {
      if (err instanceof MicrotronAPI.MicroError) {
        if (err.errors === 'Нет товаров для вывода') {
          this.logger.debug(
            err.errors,
            _.pick(err, [
              'url',
              'path',
              'errors',
              'response.config.data',
              'response.config.url',
            ]),
          );

          const result = {};
          _.forEach(categoryIds, (categoryId) => {
            result[categoryId] = [];
            this.productsCache.set(categoryId, result[categoryId]);
          });

          return result;
        }
      }

      throw err;
    }
  }

  private async parseProduct(url: string): Promise<IParseResult> {
    const parser = await MicrotronAPI.ParserV2.load(url);
    const result = parser.parse();

    this.productsParseCache.set(url, result);

    return result;
  }

  private async loadFileWithCache(filePath: string) {
    try {
      this.logger.debug('Check access to file path with cache', {
        filePath,
      });
      await fs.access(filePath);

      this.logger.debug('Read file with cache', { filePath });
      const fileRawData = await fs.readFile(filePath, { encoding: 'utf-8' });

      return JSON.parse(fileRawData);
    } catch (err) {
      this.logger.error('Error in load file cache', err);
      throw err;
    }
  }

  public async loadProductsCacheFromFile(filePath: string) {
    const cache = await this.loadFileWithCache(filePath);

    this.logger.debug('Load products cache to service', {
      count: Object.values(cache).length,
    });
    this.productsParseCache = new Map(Object.entries(cache));
  }

  public async loadProductsParseCacheFromFile(filePath: string) {
    const cache = await this.loadFileWithCache(filePath);

    this.logger.debug('Load products parse cache to service', {
      count: Object.values(cache).length,
    });
    this.productsParseCache = new Map(Object.entries(cache));
  }

  public async translateSentence(
    type: string,
    text: string,
    from: GoogleTranslateTypes.Lang,
    to: GoogleTranslateTypes.Lang,
  ): Promise<string | null> {
    const maxLength = GoogleTranslate.Request.MAX_LENGTH;
    const skipProcess = text.length > maxLength;

    this.logger.debug(`Product "${type}" translating...`, {
      type,
      skipProcess,
      size: text.length,
      maxSize: maxLength,
    });

    if (skipProcess) return null;

    const { translatedText, sourceText } =
      await this.translateService.translateViaGoogle(text, from, to);
    this.logger.debug(`Translated product "${type}" result:`, {
      type,
      sourceText,
      translatedText,
    });

    this.logger.debug('Sleep 100ms');
    await this.timeHelper.sleep(100);

    return translatedText;
  }

  public async translateRecords(
    record: Record<string, string>,
    from: GoogleTranslateTypes.Lang,
    to: GoogleTranslateTypes.Lang,
  ): Promise<Record<string, string>> {
    const additionalSize = `":"`.length;

    const preparedTextArr = this.dataUtilHelper.splitStringArrByLength(
      Object.entries(record).map(([key, value]) => `"${key}: ${value}"`),
      GoogleTranslate.Request.MAX_SENTENCES_LENGTH - additionalSize,
    );

    this.logger.debug(`Product "specifications" translating...`, {
      record,
      specCount: Object.keys(record).length,
      partedArraysCount: preparedTextArr.length,
    });

    const result = [];

    let currentArrIndex = 0;
    while (currentArrIndex < preparedTextArr.length) {
      const partNumber = currentArrIndex + 1;
      const text = preparedTextArr[currentArrIndex].join('.');

      this.logger.debug(`Prepared part:`, {
        partNumber,
        data: preparedTextArr[currentArrIndex],
      });

      const { translatedText, sourceText } =
        await this.translateService.translateViaGoogle(text, from, to);
      this.logger.debug(`Translated product "specifications" part result:`, {
        partNumber,
        sourceText,
        translatedText,
      });

      const parsedArr = translatedText
        .replaceAll('". "', '"."')
        .split('"."')
        .map((el) =>
          el
            .replaceAll('\\', '')
            .replaceAll('"', '')
            .split(':')
            .map((v) => v.trim()),
        );

      this.logger.debug(`Parsed translated part:`, {
        partNumber,
        data: parsedArr,
      });

      result.push(...parsedArr);
      currentArrIndex++;

      if (currentArrIndex < preparedTextArr.length) {
        this.logger.debug('Sleep 250ms');
        await this.timeHelper.sleep(250);
      }
    }

    const translatedRecord = Object.fromEntries(result);
    this.logger.debug(`Translate product "specifications" result:`, {
      record: translatedRecord,
    });

    return translatedRecord;
  }

  public async getProductsByAPI(
    categoryIds: string[],
    force: boolean,
  ): Promise<TLoadProductsResult> {
    if (force) {
      this.logger.debug('Force load products by categories:', {
        categoryIds: categoryIds,
      });
      return this.retrieveProductsFromAPI(categoryIds);
    }

    const cachedIds = [...this.productsCache.keys()];
    const { added: newCategoryIds, intersection: cachedCategoryIds } =
      this.dataUtilHelper.getDiff(categoryIds, cachedIds);

    this.logger.debug('Load products by categories:', {
      fromAPI: newCategoryIds,
      fromCache: cachedCategoryIds,
    });

    const newProducts = await this.retrieveProductsFromAPI(newCategoryIds);
    const cachedProducts = this.retrieveProductsFromCache(cachedCategoryIds);

    return {
      ...newProducts,
      ...cachedProducts,
    };
  }

  public getAllCachedProducts(): TLoadProductsResult {
    const cachedIds = [...this.productsCache.keys()];
    return Object.fromEntries(
      _.map(cachedIds, (categoryId) => {
        return [categoryId, this.productsCache.get(categoryId)];
      }),
    );
  }

  public getCachedByCategories(categoryIds: string[]): TLoadProductsResult {
    const result = {};
    _.forEach(categoryIds, (categoryId) => {
      if (this.productsCache.has(categoryId)) {
        result[categoryId] = this.productsCache.get(categoryId);
      }
    });

    return result;
  }

  public getCachedByIds(productIds: number[]): IProductFull[] {
    return Array.from(this.productsCache.values())
      .flat()
      .filter((product) => {
        return productIds.includes(product.id);
      });
  }

  public async parse(url: string, force: boolean): Promise<IParseResult> {
    if (force) {
      this.logger.debug('Force parse product:', { url });
      return this.parseProduct(url);
    }

    if (this.productsParseCache.has(url)) {
      this.logger.debug('Load parse product result from cache:', { url });
      return this.productsParseCache.get(url);
    }

    this.logger.debug('Parse product:', { url });
    return this.parseProduct(url);
  }

  public async parseRU(url: string, force: boolean): Promise<IParseResult> {
    this.logger.debug('RU Parse product:', { url });

    const productIdIndex = url.lastIndexOf('/p');

    const productId = url.slice(productIdIndex + 1); // with p*
    const urlWithoutProductId = url.slice(0, productIdIndex);

    if (urlWithoutProductId.endsWith('_ru')) {
      this.logger.debug('Product url already RU version:', { url });
      return this.parse(url, force);
    }

    const newUrl = `${urlWithoutProductId}_ru/${productId}`;
    this.logger.debug('Transform product url to RU version:', { url, newUrl });

    return this.parse(newUrl, force);
  }

  public async translate(
    productData: TranslateProductDto,
    from: GoogleTranslateTypes.Lang,
    to: GoogleTranslateTypes.Lang,
  ): Promise<ITranslatedProduct> {
    this.logger.log('Received data for translate:', {
      from,
      to,
      data: productData,
    });

    const result: ITranslatedProduct = {
      name: null,
      description: null,
      specifications: {},
    };

    result.name = await this.translateSentence(
      'name',
      productData.name,
      from,
      to,
    );

    result.description = await this.translateSentence(
      'description',
      productData.description,
      from,
      to,
    );

    result.specifications = await this.translateRecords(
      productData.specifications,
      from,
      to,
    );

    return result;
  }
}
