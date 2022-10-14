import { applyDecorators, UseGuards } from '@nestjs/common';
import { UserRole } from '@schemas/user';
import { Roles } from '@common/decorators/roles.decorator';
import { TelegrafRolesGuard } from '../guards';

export function TelegramAuth(...roles: UserRole[]) {
  return applyDecorators(Roles(...roles), UseGuards(TelegrafRolesGuard));
}
