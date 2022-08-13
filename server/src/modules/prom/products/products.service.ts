import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PromAPI, { Product as PromProduct } from '@lib/prom';

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
    const editeResult = await this.productAPI.editByExternalId(data);

    return editeResult;
  }
}
