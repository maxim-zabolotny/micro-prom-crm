import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SyncService {
  constructor(private configService: ConfigService) {}
}
