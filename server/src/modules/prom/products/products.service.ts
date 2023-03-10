import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PromAPI, { LibErrors, Product as PromProduct, Product } from '@lib/prom';
import { AppConstants } from '../../../app.constants';

@Injectable()
export class PromProductsService {
  private readonly logger = new Logger(this.constructor.name);

  private readonly productAPI: PromProduct.Product;

  constructor(private configService: ConfigService) {
    this.productAPI = new PromAPI.Product({
      token: configService.get('tokens.prom'),
    });
  }

  public async getList(): Promise<PromProduct.TGetProductsListResponse> {
    this.logger.debug('Load products from API');
    const products = await this.productAPI.getList();

    return products;
  }

  public async edit(
    data: PromProduct.IPostProductsEditByExternalIdBody[],
  ): Promise<PromProduct.TPostProductsEditByExternalIdResponse> {
    this.logger.debug('Edit products by API');

    try {
      const editeResult = await this.productAPI.editByExternalId(data);
      return editeResult;
    } catch (err: unknown) {
      const isProductEditError =
        err['type'] === LibErrors.APIErrorType.ProductEdit;
      if (err instanceof LibErrors.PromAPIError && isProductEditError) {
        return err.data;
      }

      throw err;
    }
  }

  public async importSheet() {
    this.logger.debug('Import Google Sheet to Prom');

    try {
      const result = await this.productAPI.importUrl({
        url: AppConstants.Google.Sheet.SHARE_URL,
        mark_missing_product_as: Product.MarkMissingProductAs.Deleted,
        force_update: true,
        only_available: false,
        updated_fields: [
          Product.ProductUpdatedFields.Name,
          Product.ProductUpdatedFields.Sku,
          Product.ProductUpdatedFields.Price,
          Product.ProductUpdatedFields.ImagesUrls,
          Product.ProductUpdatedFields.Presence,
          Product.ProductUpdatedFields.QuantityInStock,
          Product.ProductUpdatedFields.Description,
          Product.ProductUpdatedFields.Group,
          Product.ProductUpdatedFields.Keywords,
          Product.ProductUpdatedFields.Attributes,
        ],
      });

      this.logger.debug('Import Google Sheet to Prom result:', result);

      return result;
    } catch (err: unknown) {
      const isImportProductsError =
        err['type'] === LibErrors.APIErrorType.ImportProducts;

      if (err instanceof LibErrors.PromAPIError && isImportProductsError) {
        this.logger.debug(
          'Import Google Sheet to Prom with error result:',
          err.data,
        );

        return err.data;
      }

      throw err;
    }
  }

  public async getImportStatus(importId: string) {
    this.logger.debug('Get Import status:', { importId });

    const result = await this.productAPI.getImportStatus(importId);

    this.logger.debug('Import status:', result);

    return result;
  }
}
