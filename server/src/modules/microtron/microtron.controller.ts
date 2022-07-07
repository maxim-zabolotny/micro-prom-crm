import { Controller } from '@nestjs/common';
import { MicrotronService } from './microtron.service';

@Controller('microtron')
export class MicrotronController {
  constructor(private readonly microtronService: MicrotronService) {}
}
