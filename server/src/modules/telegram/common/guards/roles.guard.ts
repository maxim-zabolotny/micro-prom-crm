import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User, UserModel, UserRole } from '@schemas/user';
import { ConfigService } from '@nestjs/config';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class TelegrafRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: UserModel,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const telegramContext =
      TelegrafExecutionContext.create(context).getContext<Context>();

    const user = await this.userModel.getByTelegram(
      telegramContext.update['message'].from.id,
    );
    if (!user) {
      throw new Error(`You haven't access`);
    }

    const roles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }

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
