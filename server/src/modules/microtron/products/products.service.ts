import * as _ from 'lodash';
import * as path from 'path';
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
import {
  IProductFullInfo,
  ITranslatedProduct,
} from '@common/interfaces/product';
import { MicrotronCategoriesService } from '../categories/categories.service';
import { ICategoryInConstant } from '@common/interfaces/category';
import { ProductsParseMap } from './utils/ProductsParseMap';
import { MicrotronCoursesService } from '../courses/courses.service';

type IProductFull = Product.IProductFull;
type IProductRequestOptions = Product.IProductRequestOptions;

type IParseResult = ParserV2.IResult;

export type TLoadProductsResult = Record<string, IProductFull[]>;
export type TProductsCache = Map<string, IProductFull[]>;
export type TProductsParseCache = Map<string, IParseResult | null>;

export type TParseProductsConfig = {
  chunk: number;
  limit: number;
  sleep: number;
  getAwaySleep: number;
};

@Injectable()
export class MicrotronProductsService {
  private readonly logger = new Logger(this.constructor.name);

  private readonly productsAPI: Product.Product;
  private readonly productsAPIDefaultOptions: IProductRequestOptions = {
    local: true,
    lang: Types.Lang.UA,
  };

  private readonly isValidProduct = (
    product: Pick<
      IProductFull,
      'url' | 'price' | 'price_s' | 'quantity' | 'quantity_s'
    >,
  ) => {
    // DATA
    const price = _.isNumber(product.price) ? product.price : product.price_s;
    const quantity = _.isNumber(product.quantity)
      ? product.quantity
      : product.quantity_s;

    // CHECKS
    const baseCheck = _.conformsTo<Pick<IProductFull, 'url'>>(product, {
      url: (url: string) => {
        const isEmptyUrl = _.isEmpty(url);
        if (isEmptyUrl) return false;

        const isInvalidUrl = url
          .slice(0, url.lastIndexOf('/p'))
          .endsWith('microtron.ua');
        if (isInvalidUrl) return false;

        return true;
      },
    });

    const minPriceCheck = price > 0;
    const minQuantityCheck = quantity >= 1; // TODO: temp solution

    // VERIFY
    const conditions = [baseCheck, minPriceCheck, minQuantityCheck];

    return _.every(conditions, (cond) => cond === true);
  };

  private readonly isValidProductFullInfo = (
    product: Partial<IProductFullInfo>,
    course: number,
  ) => {
    // DATA
    const originalPrice = _.isNumber(product.price)
      ? product.price
      : product.price_s;
    const sitePrice = product.parse.cost.price;

    // CHECKS
    const baseCheck = _.conformsTo<Partial<IProductFullInfo>>(product, {
      parse: (v: Partial<IProductFullInfo['parse']>) => {
        return _.conformsTo(v, {
          description: (v: string) => v.length > 0,
        });
      },
    });

    // TODO: temp solution
    let isValidPrice = true;
    if (product.currency === Types.Currency.USD && sitePrice > 0) {
      const rawPrice = originalPrice * course;
      const onePercentFromRawPrice = rawPrice / 100;

      const siteMarkup = (sitePrice - rawPrice) / onePercentFromRawPrice;

      isValidPrice = siteMarkup >= -20;
    }

    // VERIFY
    const conditions = [baseCheck, isValidPrice];

    return _.every(conditions, (cond) => cond === true);
  };

  private productsCache: TProductsCache = new Map();
  private productsParseCache: TProductsParseCache = new ProductsParseMap();

  private parseProductsConfig: TParseProductsConfig = {
    chunk: 10,
    limit: Infinity,
    sleep: 1000 * 2,
    getAwaySleep: 1000 * 30,
  };

  public readonly productsCacheFilePath = path
    .join(__dirname, '../../../data/cache/products-cache.json')
    .replace('dist', 'src');
  public readonly productsParseCacheFilePath = path
    .join(__dirname, '../../../data/cache/products-parse-cache.json')
    .replace('dist', 'src');

  constructor(
    private configService: ConfigService,
    private microtronCategoriesService: MicrotronCategoriesService,
    private microtronCourseService: MicrotronCoursesService,
    private translateService: TranslateService,
    private dataUtilHelper: DataUtilsHelper,
    private timeHelper: TimeHelper,
  ) {
    this.productsAPI = new MicrotronAPI.Product({
      token: configService.get('tokens.microtron'),
    });
  }

  private excludeInvalidProducts(products: IProductFull[]) {
    this.logger.debug('Passed Products for filtering:', {
      count: products.length,
    });

    const validProducts = _.filter(
      products,
      this.isValidProduct,
    ) as IProductFull[];
    this.logger.debug('Filter Products result:', {
      valid: validProducts.length,
      invalid: products.length - validProducts.length,
    });

    return validProducts;
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

        if (!_.isEmpty(groupedProducts[categoryId])) {
          groupedProducts[categoryId] = this.excludeInvalidProducts(
            groupedProducts[categoryId],
          );
        }

        this.productsCache.set(categoryId, groupedProducts[categoryId]);
      });

      this.logger.debug('Loaded categories result:', {
        passed: categoryIds,
        loaded: productCategoryIds,
        all: allCategoryIds,
      });

      const resultProductsCount = _.reduce(
        allCategoryIds,
        (acc, categoryId) => acc + groupedProducts[categoryId].length,
        0,
      );
      this.logger.debug('Loaded products result:', {
        countRaw: products.length,
        countFiltered: resultProductsCount,
        countInvalid: products.length - resultProductsCount,
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

  private async parseProduct(url: string): Promise<IParseResult | null> {
    let result: IParseResult | null;

    try {
      const parser = await MicrotronAPI.ParserV2.load(url);
      result = parser.parse();
    } catch (err: any) {
      const response = err?.response;
      if (response && response.status === 404) {
        this.logger.debug('URL not found. Return null:', {
          url,
          response: {
            status: response.status,
            text: response.statusText,
          },
        });

        result = null;
      } else {
        throw err;
      }
    }

    this.productsParseCache.set(url, result);
    return result;
  }

  private async saveCacheToFile(
    filePath: string,
    cacheMap: Map<string, unknown>,
  ) {
    this.logger.debug('Save cache to file', {
      filePath,
    });

    const data = JSON.stringify(
      Object.fromEntries(cacheMap.entries()),
      null,
      2,
    );
    await fs.writeFile(filePath, data, { encoding: 'utf-8' });
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

  public async saveProductsCache(
    filePath: string = this.productsCacheFilePath,
  ) {
    this.logger.debug('Products cache size:', {
      count: _.reduce(
        [...this.productsCache.keys()],
        (acc, key) => acc + this.productsCache.get(key).length,
        0,
      ),
    });
    await this.saveCacheToFile(filePath, this.productsCache);
  }

  public async loadProductsCacheFromFile(filePath: string) {
    const cache = await this.loadFileWithCache(filePath);

    this.logger.debug('Load products cache to service', {
      count: _.reduce(
        Object.keys(cache),
        (acc, key) => acc + cache[key].length,
        0,
      ),
    });
    this.productsCache = new Map(Object.entries(cache));
  }

  public async saveProductsParseCache(
    filePath: string = this.productsParseCacheFilePath,
  ) {
    this.logger.debug('Products parse cache size:', {
      count: this.productsParseCache.size,
    });
    await this.saveCacheToFile(filePath, this.productsParseCache);
  }

  public async loadProductsParseCacheFromFile(filePath: string) {
    const cache = await this.loadFileWithCache(filePath);

    this.logger.debug('Load products parse cache to service', {
      count: Object.keys(cache).length,
    });
    this.productsParseCache = new ProductsParseMap(Object.entries(cache));
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

  public buildProductRUUrl(url: string) {
    const productIdIndex = url.lastIndexOf('/p');

    const productId = url.slice(productIdIndex + 1); // with p*
    const urlWithoutProductId = url.slice(0, productIdIndex);

    if (urlWithoutProductId.endsWith('_ru')) {
      this.logger.debug('Product url already RU version:', { url });
      return url;
    }

    const newUrl = `${urlWithoutProductId}_ru/${productId}`;
    this.logger.debug('Transform product url to RU version:', { url, newUrl });

    return newUrl;
  }

  public buildUnionProductUrl(url: string) {
    const keyValue = 'microtron.ua';
    const keyValueIndex = url.indexOf(keyValue);

    if (keyValueIndex < 0) {
      this.logger.debug('Product url already union version:', { url });
      return url;
    }

    const unionUrl = url.slice(keyValueIndex + keyValue.length);
    this.logger.debug('Transform Product url to union version:', {
      url,
      unionUrl,
    });

    return unionUrl;
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

  public async getAllProductsBySavedCategories(force: boolean) {
    const categories = (await this.microtronCategoriesService.getSaved(
      false,
    )) as ICategoryInConstant[];

    const categoryIds = _.map(categories, 'id');
    this.logger.debug('Count of saved categories in DB:', {
      count: categoryIds.length,
    });

    return this.getProductsByAPI(categoryIds, force);
  }

  public async getAllProductsFullInfoBySavedCategories(
    forceLoad: boolean,
    forceParse: boolean,
  ) {
    const categories = (await this.microtronCategoriesService.getSaved(
      false,
    )) as ICategoryInConstant[];

    const categoryIds = _.map(categories, 'id');
    this.logger.debug('Count of saved categories in DB:', {
      count: categoryIds.length,
    });

    return this.getFullProductsInfo(categoryIds, { forceLoad, forceParse });
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

  public removeEmptyProductsParseResults() {
    let countEmptyResults = 0;
    this.productsParseCache.forEach((parseResult, url) => {
      if (_.isNil(parseResult)) {
        this.productsParseCache.delete(url);
        countEmptyResults++;
      }
    });

    this.logger.debug('Removed empty parse results:', {
      count: countEmptyResults,
    });

    return countEmptyResults;
  }

  public async parse(
    url: string,
    force: boolean,
  ): Promise<IParseResult | null> {
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

  public async parseRU(
    url: string,
    force: boolean,
  ): Promise<IParseResult | null> {
    this.logger.debug('RU Parse product:', { url });

    const newUrl = this.buildProductRUUrl(url);
    return this.parse(newUrl, force);
  }

  public async parseProducts(
    products: Array<Pick<IProductFull, 'id' | 'url'>>,
    force: boolean,
    config: TParseProductsConfig = this.parseProductsConfig,
  ): Promise<Record<string, IParseResult | null>> {
    const parsedProducts: Record<string, IParseResult | null> = {};
    const productsToParse: Array<Pick<IProductFull, 'id' | 'url'>> = [];

    if (force) {
      productsToParse.push(...products);
    } else {
      _.forEach(products, (product) => {
        const { url } = product;

        if (this.productsParseCache.has(url)) {
          parsedProducts[url] = this.productsParseCache.get(url);
        } else {
          productsToParse.push(product);
        }
      });

      this.logger.debug('Take parse products cache:', {
        count: Object.keys(parsedProducts).length,
      });
    }

    if (!_.isEmpty(productsToParse)) {
      const orderedProducts = _.orderBy(
        productsToParse,
        (product) => product.id,
        ['asc'],
      );
      const chunks = _.chunk(orderedProducts, config.chunk);

      this.logger.debug('Parse products:', {
        products: orderedProducts.length,
        chunks: chunks.length,
      });

      let chunkIndex = 0;
      for (const chunk of chunks) {
        const chunkNumber = chunkIndex + 1;

        this.logger.debug('Parse chunk:', {
          number: chunkNumber,
          size: chunk.length,
        });

        const parsedChunkProducts = _.compact(
          _.flattenDeep(
            await Promise.all(
              chunk.map(async (product) => {
                try {
                  const parse = await this.parse(product.url, true);

                  return {
                    url: product.url,
                    parse: parse,
                  };
                } catch (err) {
                  const response = err?.response;
                  if (response && response.status === 502) {
                    this.logger.debug('Request limit exceeded:', {
                      productId: product.id,
                      productUrl: product.url,
                      response: {
                        status: response.status,
                        text: response.statusText,
                      },
                    });

                    this.logger.log(
                      'Push product to current chunk array and sleep...',
                      {
                        productId: product.id,
                        productUrl: product.url,
                        sleepMS: config.getAwaySleep,
                      },
                    );

                    chunk.push(product);
                    await this.timeHelper.sleep(config.getAwaySleep);

                    return;
                  } else {
                    throw err;
                  }
                }
              }),
            ),
          ),
        );

        _.forEach(
          parsedChunkProducts,
          (parsedProduct) =>
            (parsedProducts[parsedProduct.url] = parsedProduct.parse),
        );

        const productsLeft =
          orderedProducts.length - chunkNumber * config.chunk;
        this.logger.debug('Chunk parsed:', {
          number: chunkNumber,
          productsCount: parsedChunkProducts.length,
          allProductsCount: orderedProducts.length,
          productsLeft: productsLeft >= 0 ? productsLeft : 0,
        });

        chunkIndex++;
        if (chunkNumber < chunks.length) {
          if (orderedProducts.length - productsLeft >= config.limit) {
            this.logger.debug('Limit exceeded. Break:', {
              limit: config.limit,
              processed: orderedProducts.length - productsLeft,
            });
            break;
          }

          this.logger.log(`Sleep ${config.sleep / 1000}s`, {
            timeMS: config.sleep,
          });
          await this.timeHelper.sleep(config.sleep);
        }
      }
    }

    return parsedProducts;
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

  public async getFullProductsInfo(
    categoryIds: string[],
    {
      forceLoad,
      forceParse,
    }: {
      forceLoad: boolean;
      forceParse: boolean;
    },
  ): Promise<Record<string, IProductFullInfo[]>> {
    this.logger.debug('Load full products info:', {
      categoryIds,
      forceLoad,
      forceParse,
    });

    /// CACHE
    this.logger.debug('Load parse products cache');
    await this.loadProductsParseCacheFromFile(this.productsParseCacheFilePath);

    this.logger.debug('Remove empty parse results');
    this.removeEmptyProductsParseResults();

    /// MAIN
    const course = await this.microtronCourseService.getCoursesByAPI(true);

    // load children categories too
    const productsByCategories = await this.getProductsByAPI(
      categoryIds,
      forceLoad,
    );
    const productsEntriesByCategories = Object.entries(productsByCategories);

    let invalidParsedProductsCount = 0;
    let invalidProductsWithFullInfoCount = 0;
    const productsWithFullInfo: Record<string, IProductFullInfo[]> = {};

    for (const [
      categoryId,
      productsByCategory,
    ] of productsEntriesByCategories) {
      this.logger.debug('Loaded Products by Category:', {
        categoryId,
        count: productsByCategory.length,
      });

      this.logger.debug('Build RU Products URL');
      const uaProducts = _.map(productsByCategory, (product) =>
        _.pick(product, ['id', 'url']),
      );
      const ruProducts = _.map(uaProducts, (product) => ({
        id: product.id,
        url: this.buildProductRUUrl(product.url),
      }));

      const allProducts = _.uniqBy(
        [...uaProducts, ...ruProducts],
        (product) => product.url,
      );

      this.logger.debug('Start parsing Products:', {
        allCount: allProducts.length,
        uaCount: uaProducts.length,
        ruCount: ruProducts.length,
      });

      const parsedProducts = await this.parseProducts(allProducts, forceParse);
      const compactParsedProductsMap = new Map(
        _.filter(Object.entries(parsedProducts), ([, parseResult]) =>
          Boolean(parseResult),
        ),
      );

      this.logger.debug('Parsed Products:', {
        count: Object.keys(parsedProducts).length,
        compactCount: compactParsedProductsMap.size,
      });

      // STAT
      invalidParsedProductsCount +=
        Object.keys(parsedProducts).length - compactParsedProductsMap.size;

      const products: IProductFullInfo[] = _.compact(
        _.map(productsByCategory, (product) => {
          const uaParse = compactParsedProductsMap.get(product.url);
          const ruParse = compactParsedProductsMap.get(
            this.buildProductRUUrl(product.url),
          );

          if (!uaParse || !ruParse) {
            this.logger.debug(`Product doesn't have parse results. Skip:`, {
              id: product.id,
              uaParse: Boolean(uaParse),
              ruParse: Boolean(ruParse),
            });

            return null;
          }

          return {
            ..._.omit(product, ['RRP', 'description']),
            parse: _.omit(uaParse, ['name', 'brand', 'availability', 'url']),
            translate: _.pick(ruParse, ['name', 'description']),
          };
        }),
      );

      this.logger.debug('Validate products with full info');
      productsWithFullInfo[categoryId] = _.filter(products, (product) =>
        this.isValidProductFullInfo(product, course.bank),
      ) as IProductFullInfo[];

      this.logger.debug('Loaded full info Products by Category:', {
        categoryId,
        allCount: products.length,
        validCount: productsWithFullInfo[categoryId].length,
      });

      // STAT
      invalidProductsWithFullInfoCount +=
        products.length - productsWithFullInfo[categoryId].length;
    }

    this.logger.debug('Loaded Full Products info:', {
      invalidParsedProductsCount,
      invalidProductsWithFullInfoCount,
      categoriesCount: productsWithFullInfo.length,
      productsCount: _.reduce(
        Object.keys(productsWithFullInfo),
        (acc, key) => acc + productsWithFullInfo[key].length,
        0,
      ),
    });

    /// CACHE
    this.logger.debug('Save cache');
    await this.saveProductsCache(this.productsCacheFilePath);
    await this.saveProductsParseCache(this.productsParseCacheFilePath);

    return productsWithFullInfo;
  }
}
