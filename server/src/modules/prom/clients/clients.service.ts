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

  public async getById(clientId: number) {
    this.logger.debug('Get client by id:', {
      clientId,
    });

    try {
      const { client } = await this.clientsAPI.getById(clientId);

      this.logger.debug('Found client:', {
        client,
      });

      return client;
    } catch (err: unknown) {
      const isNotFoundError = err['statusCode'] === 404;

      if (isNotFoundError) {
        this.logger.debug('Client not found:', {
          clientId,
        });

        return null;
      }

      throw err;
    }
  }

  public async search(query: string) {
    this.logger.debug('Search clients by query:', {
      query,
    });

    const { clients } = await this.clientsAPI.getList({
      search_term: query,
      limit: 20,
    });

    this.logger.debug('Found clients:', {
      count: clients.length,
    });

    return clients;
  }
}
