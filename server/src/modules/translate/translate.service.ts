import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TranslateService {
  constructor(private configService: ConfigService) {}
}
