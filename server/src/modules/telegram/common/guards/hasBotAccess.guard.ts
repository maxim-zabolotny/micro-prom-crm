import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User, UserModel } from '@schemas/user';
import { ConfigService } from '@nestjs/config';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class TelegrafHasBotAccessGuard implements CanActivate {
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

    return user.hasBotAccess;
  }
}
