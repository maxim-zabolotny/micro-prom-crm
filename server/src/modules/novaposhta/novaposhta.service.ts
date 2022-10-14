import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NovaposhtaService {
  constructor(private configService: ConfigService) {}
}
