import { Controller } from '@nestjs/common';
import { AdminService } from './microtron.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
}
