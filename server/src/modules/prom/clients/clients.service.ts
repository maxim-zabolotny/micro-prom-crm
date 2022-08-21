import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PromAPI, { Client as PromClient } from '@lib/prom';

@Injectable()
export class PromClientsService {
  private readonly logger = new Logger(this.constructor.name);

  private readonly clientsAPI: PromClient.Client;

  constructor(private configService: ConfigService) {
    this.clientsAPI = new PromAPI.Client({
      token: configService.get('tokens.prom'),
    });
  }
}
