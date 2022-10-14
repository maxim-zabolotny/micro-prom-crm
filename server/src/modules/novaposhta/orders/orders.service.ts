import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { Axios } from 'axios';

@Injectable()
export class NovaposhtaOrdersService {
  private readonly logger = new Logger(this.constructor.name);

  private readonly axios: Axios;

  constructor(private configService: ConfigService) {
    this.axios = axios.create({});
  }

  public async getPDFPrintMaking(declarationId: string) {
    const size = '100x100';

    this.logger.debug('Get print making:', {
      declarationId,
      size,
    });

    const authToken = this.configService.get('novaPoshta.token');
    const result = await this.axios.request({
      method: 'get',
      url: `https://my.novaposhta.ua/orders/printMarking${size}/orders[]/${declarationId}/type/pdf/apiKey/${authToken}`,
      responseType: 'arraybuffer',
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    return result.data as Buffer;
  }
}
