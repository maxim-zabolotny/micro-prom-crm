/*external modules*/
import _ from 'lodash';
/*lib*/
import { Request } from '../request';
import { IProductRequestOptions, Product, TEntity as TProductEntity } from '../product';
/*types*/
import { Lang } from '../types/api';
import { ICategoriesTree, ICategory, ICategoryRaw } from './ICategorie';
import { IResponseRaw } from '../request/IResponse';
/*utils*/
import { makeTree } from '../utils';
/*other*/

export type TEntity = ICategory;
export type TRawEntity = ICategoryRaw;

export {
  ICategory,
  ICategoryRaw,
  ICategoriesTree,
};

export class Category extends Request<TEntity[], TRawEntity[]> {
  protected parseResult(data: IResponseRaw<TRawEntity[]>) {
    const { data: responseData, ...responseFields } = super.parseData(data);

    return {
      ...responseFields,
      data: _.map(
        responseData,
        (categoryData) => ({
          ...categoryData,
          id: String(categoryData.id),
          parentId: String(categoryData.parentId),
        }),
      ) as TEntity[],
      // data: _.map(
      //   responseData,
      //   (categoryData) => ({
      //     ...categoryData,
      //     id: Number(categoryData.id),
      //     parentId: Number(categoryData.parentId),
      //   }),
      // ) as TEntity[],
    };
  }

  public async getCategories(lang: Lang = Lang.UA): Promise<TEntity[]> {
    return Request.requestWrapper(Category, this, { lang });
  }

  public async getProducts<TProduct extends TProductEntity>(category: Pick<TEntity, 'id'>, options: Omit<IProductRequestOptions, 'categoryIds'> = {}): Promise<TProduct[]> {
    const product = new Product({ token: this.token });
    const products = await product.getProducts(
      {
        ...options,
        categoryIds: [category.id],
      },
      options.full as any,
    );

    return products as TProduct[];
  }

  public static buildCategoriesTree(categories: TEntity[]) {
    return makeTree<TEntity, 'parentId', ICategoriesTree[]>(categories, 'parentId', '0');
  }

  static readonly PATH = 'categories';
}
