import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@schemas/user';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return this.matchRoles(roles, user.role);
  }

  matchRoles(roles: UserRole[], userRole: UserRole): boolean {
    if (
      this.configService.get('rules.adminIsSuperuser') &&
      userRole === UserRole.Admin
    ) {
      return true;
    }

    if (roles.every((role) => role === UserRole.General)) {
      return true;
    }

    return roles.some((role) => role === userRole);
  }
}
