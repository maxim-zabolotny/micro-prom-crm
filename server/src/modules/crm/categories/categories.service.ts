import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CrmCategoriesService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private configService: ConfigService) {}
}
