import { Request } from '../request';
import { IGetProductsListQueryParams, IImportProduct, ImportProductStatus, IPostProductsEditBody, IPostProductsEditByExternalIdBody, IPostProductsImportUrlBody, IProduct, IProductCategory, IProductDiscount, IProductImage, IProductPrice, MarkMissingProductAs, ProductDiscountType, ProductPresence, ProductSellingType, ProductStatus, ProductUpdatedFields, TGetProductByExternalIdResponse, TGetProductByIdResponse, TGetProductsImportStatusResponse, TGetProductsListResponse, TImportProductErrors, TPostProductsEditByExternalIdResponse, TPostProductsEditResponse, TPostProductsImportUrlResponse } from './IProduct';
export { ProductStatus, ProductSellingType, ProductPresence, ProductDiscountType, MarkMissingProductAs, ProductUpdatedFields, ImportProductStatus, IProductDiscount, IProductCategory, IProductPrice, IProductImage, TImportProductErrors, IProduct, IImportProduct, IGetProductsListQueryParams, IPostProductsEditBody, IPostProductsEditByExternalIdBody, IPostProductsImportUrlBody, TGetProductsListResponse, TGetProductByIdResponse, TGetProductByExternalIdResponse, TPostProductsEditResponse, TPostProductsEditByExternalIdResponse, TPostProductsImportUrlResponse, TGetProductsImportStatusResponse, };
export declare class Product extends Request {
    protected buildUrl(path: string | number): string;
    getList(params?: IGetProductsListQueryParams): Promise<TGetProductsListResponse>;
    getById(productId: number): Promise<TGetProductByIdResponse>;
    getByExternalId(externalId: string): Promise<TGetProductByExternalIdResponse>;
    edit(data: IPostProductsEditBody[]): Promise<TPostProductsEditResponse>;
    editByExternalId(data: IPostProductsEditByExternalIdBody[]): Promise<TPostProductsEditByExternalIdResponse>;
    importUrl(data: IPostProductsImportUrlBody): Promise<TPostProductsImportUrlResponse>;
    getImportStatus(importId: number): Promise<TGetProductsImportStatusResponse>;
    static readonly BASE_PATH = "products";
}
