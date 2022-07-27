import * as _ from 'lodash';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataUtilsHelper } from '@common/helpers';
import MicrotronAPI, { ParserV2, Product, Types } from '@lib/microtron';

type IProductFull = Product.IProductFull;
type IProductRequestOptions = Product.IProductRequestOptions;

type IParseResult = ParserV2.IResult;

export type TLoadProductsResult = Record<string, IProductFull[]>;
export type TProductsCache = Map<string, IProductFull[]>;
export type TProductsParseCache = Map<string, IParseResult>;

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(this.constructor.name);

  private readonly productsAPI: Product.Product;
  private readonly productsAPIDefaultOptions: IProductRequestOptions;

  private readonly productsCache: TProductsCache = new Map();
  private readonly productsParseCache: TProductsParseCache = new Map();

  constructor(
    private configService: ConfigService,
    private dataUtilHelper: DataUtilsHelper,
  ) {
    this.productsAPI = new MicrotronAPI.Product({
      token: configService.get('tokens.microtron'),
    });
    this.productsAPIDefaultOptions = {
      local: true,
      lang: Types.Lang.UA,
    };
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
}
