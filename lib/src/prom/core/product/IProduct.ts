/*external modules*/
/*lib*/
/*types*/
import { IPagination } from '../types/api';
import { IGroup } from '../group';
/*other*/

// ENTITY
export enum ProductStatus {
  OnDisplay = 'on_display',
  Draft = 'draft',
  Deleted = 'deleted',
  NotOnDisplay = 'not_on_display',
  EditingRequired = 'editing_required',
  ApprovalPending = 'approval_pending',
  DeletedByModerator = 'deleted_by_moderator'
}

export enum ProductSellingType {
  Retail = 'retail',
  WholeSale = 'wholesale',
  Universal = 'universal',
  Service = 'service'
}

export enum ProductPresence {
  Available = 'available',
  NotAvailable = 'not_available',
  Order = 'order',
  Service = 'service',
  Waiting = 'waiting'
}

export enum ProductDiscountType {
  Amount = 'amount',
  Percent = 'percent'
}

export enum MarkMissingProductAs {
  None = 'none',
  NotAvailable = 'not_available',
  NotOnDisplay = 'not_on_display',
  Deleted = 'deleted'
}

export enum ProductUpdatedFields {
  Name = 'name',
  Sku = 'sku',
  Price = 'price',
  ImagesUrls = 'images_urls',
  Presence = 'presence',
  QuantityInStock = 'quantity_in_stock',
  Description = 'description',
  Group = 'group',
  Keywords = 'keywords',
  Attributes = 'attributes',
  Discount = 'discount',
  Labels = 'labels',
  Gtin = 'gtin',
  Mpn = 'mpn'
}

export enum ImportProductStatus {
  Success = 'SUCCESS',
  Partial = 'PARTIAL',
  Fatal = 'FATAL'
}

export interface IProductDiscount {
  value: number;
  type: ProductDiscountType;
  date_start: string;
  date_end: string;
}

export interface IProductCategory {
  id: number;
  caption: string;
}

export interface IProductPrice {
  price: number;
  minimum_order_quantity: number;
}

export interface IProductImage {
  id: number;
  url: string;
  thumbnail_url: string;
}

export type TImportProductErrors = 'download' | 'store_file' | 'validation' | 'import' | 'download_images';

export interface IProduct {
  id: number;
  external_id: string | null;
  name: string;
  sku: string;
  keywords: string;
  description: string;
  selling_type: ProductSellingType;
  presence: ProductPresence;
  presence_sure: boolean;
  price: number;
  minimum_order_quantity: number | null;
  discount: IProductDiscount;
  currency: string;
  group: Pick<IGroup, 'id' | 'name'>
  category: IProductCategory;
  prices: IProductPrice[];
  main_image: string;
  images: IProductImage[];
  status: ProductStatus;
}

export interface IImportProduct {
  status: ImportProductStatus;
  not_changed: number;
  updated: number;
  not_in_fle: number;
  imported: number;
  created: number;
  actualized: number;
  created_active: number;
  created_hidden: number;
  total: number;
  with_errors_count: number;
  errors: Array<Record<TImportProductErrors, Record<string, unknown>>>
}

// REQUEST
export interface IGetProductsListQueryParams extends Partial<IPagination> {
  group_id?: number;
}

export interface IPostProductsEditBody {
  id: number;
  presence?: Exclude<ProductPresence, ProductPresence.Service>;
  presence_sure?: boolean;
  price?: number;
  status?: Exclude<ProductStatus,
    | ProductStatus.EditingRequired
    | ProductStatus.ApprovalPending
    | ProductStatus.DeletedByModerator>
  prices?: IProductPrice[];
  discount?: IProductDiscount;
  name?: string;
  keywords?: string;
  description?: string;
}

export interface IPostProductsEditByExternalIdBody extends Omit<IPostProductsEditBody, 'id'> {
  id: string;
  quantity_in_stock?: number;
}

export interface IPostProductsImportUrlBody {
  url: string;
  force_update: boolean;
  only_available?: boolean;
  mark_missing_product_as?: MarkMissingProductAs;
  updated_fields?: ProductUpdatedFields;
}

// RESPONSE
export type TGetProductsListResponse = {
  group_id: number;
  products: IProduct[]
}

export type TGetProductByIdResponse = Record<'product', IProduct>
export type TGetProductByExternalIdResponse = Record<'product', IProduct>

export type TPostProductsEditResponse = {
  processed_ids: number[];
  errors: Record<string, unknown>;
}
export type TPostProductsEditByExternalIdResponse = {
  processed_ids: number[];
  errors: Record<string, unknown>;
}

export type TPostProductsImportUrlResponse = {
  id: string,
  status: 'success'
}

export type TGetProductsImportStatusResponse = IImportProduct;
