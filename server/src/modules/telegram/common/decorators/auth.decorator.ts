import { applyDecorators, UseGuards } from '@nestjs/common';
import { UserRole } from '@schemas/user';
import { Roles } from '@common/decorators/roles.decorator';
import { TelegrafHasBotAccessGuard, TelegrafRolesGuard } from '../guards';

export function TelegramAuth(...roles: UserRole[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(TelegrafRolesGuard, TelegrafHasBotAccessGuard),
  );
}
