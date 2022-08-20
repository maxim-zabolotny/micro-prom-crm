import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JobStaticService implements OnModuleInit {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // TODO: onModuleInit: recreate all static jobs
    this.logger.error(
      '----------------------------------------- MODULE INIT -------------------------------',
    );
  }
}
