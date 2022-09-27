import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Data } from '../../../data';

@Injectable()
export class AdminLogService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private configService: ConfigService) {}

  public async getDefault() {
    this.logger.debug('Request default logs');

    return Data.Logs.read();
  }
}
