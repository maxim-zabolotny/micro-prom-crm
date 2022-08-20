/*external modules*/
import urlJoin from 'url-join';
/*lib*/
import { HttpMethods, Request } from '../request';
/*types*/
import {
  IGetProductsListQueryParams,
  IImportProduct,
  ImportProductStatus,
  IPostProductsEditBody,
  IPostProductsEditByExternalIdBody,
  IPostProductsImportUrlBody,
  IProduct,
  IProductCategory,
  IProductDiscount,
  IProductImage,
  IProductPrice,
  MarkMissingProductAs,
  ProductDiscountType,
  ProductPresence,
  ProductSellingType,
  ProductStatus,
  ProductUpdatedFields,
  TGetProductByExternalIdResponse,
  TGetProductByIdResponse,
  TGetProductsImportStatusResponse,
  TGetProductsListResponse,
  TImportProductErrors,
  TPostProductsEditByExternalIdResponse,
  TPostProductsEditResponse,
  TPostProductsImportUrlResponse,
} from './IProduct';
/*other*/

export {
  ProductStatus,
  ProductSellingType,
  ProductPresence,
  ProductDiscountType,
  MarkMissingProductAs,
  ProductUpdatedFields,
  ImportProductStatus,

  IProductDiscount,
  IProductCategory,
  IProductPrice,
  IProductImage,
  TImportProductErrors,
  IProduct,
  IImportProduct,

  IGetProductsListQueryParams,
  IPostProductsEditBody,
  IPostProductsEditByExternalIdBody,
  IPostProductsImportUrlBody,

  TGetProductsListResponse,
  TGetProductByIdResponse,
  TGetProductByExternalIdResponse,
  TPostProductsEditResponse,
  TPostProductsEditByExternalIdResponse,
  TPostProductsImportUrlResponse,
  TGetProductsImportStatusResponse,
};

export class Product extends Request {
  protected buildUrl(path: string | number): string {
    return urlJoin(Product.BASE_PATH, String(path));
  }

  public async getList(params: IGetProductsListQueryParams = {}): Promise<TGetProductsListResponse> {
    const queryParams = { ...params };

    const { body } = await this.makeRequest<{}, IGetProductsListQueryParams, TGetProductsListResponse>(
      HttpMethods.Get,
      this.buildUrl('list'),
      {},
      queryParams,
    );

    return body;
  }

  public async getById(productId: number): Promise<TGetProductByIdResponse> {
    const { body } = await this.makeRequest<{}, {}, TGetProductByIdResponse>(
      HttpMethods.Get,
      this.buildUrl(productId),
      {},
      {},
    );

    return body;
  }

  public async getByExternalId(externalId: string): Promise<TGetProductByExternalIdResponse> {
    const { body } = await this.makeRequest<{}, {}, TGetProductByExternalIdResponse>(
      HttpMethods.Get,
      this.buildUrl(`by_external_id/${externalId}`),
      {},
      {},
    );

    return body;
  }

  public async edit(data: IPostProductsEditBody[]): Promise<TPostProductsEditResponse> {
    const { body } = await this.makeRequest<IPostProductsEditBody[], {}, TPostProductsEditResponse>(
      HttpMethods.Post,
      this.buildUrl('edit'),
      data,
      {},
    );

    return body;
  }

  public async editByExternalId(
    data: IPostProductsEditByExternalIdBody[],
  ): Promise<TPostProductsEditByExternalIdResponse> {
    const {
      body,
    } = await this.makeRequest<IPostProductsEditByExternalIdBody[], {}, TPostProductsEditByExternalIdResponse>(
      HttpMethods.Post,
      this.buildUrl('edit_by_external_id'),
      data,
      {},
    );

    return body;
  }

  public async importUrl(data: IPostProductsImportUrlBody): Promise<TPostProductsImportUrlResponse> {
    const { body } = await this.makeRequest<IPostProductsImportUrlBody, {}, TPostProductsImportUrlResponse>(
      HttpMethods.Post,
      this.buildUrl('import_url'),
      data,
      {},
    );

    return body;
  }

  public async getImportStatus(importId: string): Promise<TGetProductsImportStatusResponse> {
    const { body } = await this.makeRequest<{}, {}, TGetProductsImportStatusResponse>(
      HttpMethods.Get,
      this.buildUrl(`import/status/${importId}`),
      {},
      {},
    );

    return body;
  }

  public static readonly BASE_PATH = 'products';
}
