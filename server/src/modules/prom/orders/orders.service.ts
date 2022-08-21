import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PromAPI, { Order as PromOrder } from '@lib/prom';

@Injectable()
export class PromOrdersService {
  private readonly logger = new Logger(this.constructor.name);

  private readonly ordersAPI: PromOrder.Order;

  constructor(private configService: ConfigService) {
    this.ordersAPI = new PromAPI.Order({
      token: configService.get('tokens.prom'),
    });
  }
}
