import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CrmIntegrationsService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private configService: ConfigService) {}
}
