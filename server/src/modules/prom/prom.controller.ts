import { Controller } from '@nestjs/common';
import { PromService } from './prom.service';

@Controller('prom')
export class PromController {
  constructor(private readonly promService: PromService) {}
}
