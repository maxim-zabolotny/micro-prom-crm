import { Controller } from '@nestjs/common';
import { NovaposhtaService } from './novaposhta.service';

@Controller('novaposhta')
export class NovaposhtaController {
  constructor(private readonly novaposhtaService: NovaposhtaService) {}
}
