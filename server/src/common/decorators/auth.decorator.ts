import { applyDecorators, UseGuards } from '@nestjs/common';
import { UserRole } from '@schemas/user';
import { JwtAuthGuard, RolesGuard } from '@common/guards';
import { Roles } from '@common/decorators/roles.decorator';

export function Auth(...roles: UserRole[]) {
  return applyDecorators(Roles(...roles), UseGuards(JwtAuthGuard, RolesGuard));
}
