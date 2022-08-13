import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PromService {
  constructor(private configService: ConfigService) {}
}
