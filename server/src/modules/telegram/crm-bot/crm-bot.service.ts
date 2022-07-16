import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '@schemas/user';
import { Model } from 'mongoose';
import { TTelegramUser } from '../common/types';
import { TelegrafException } from 'nestjs-telegraf';
import { MarkdownHelper } from '../common/helpers';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class CrmBotService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly authService: AuthService,
  ) {}

  private async getUserByTelegramId(
    telegramId: TTelegramUser['telegramId'],
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findOne({
        telegramId,
      })
      .exec();
    if (!user) {
      throw new TelegrafException('User not found!');
    }

    return user;
  }

  public async getAuthToken(telegramId: TTelegramUser['telegramId']) {
    const user = await this.getUserByTelegramId(telegramId);
    const token = this.authService.generateAuthToken(user);

    const tokenMsg = MarkdownHelper.bold('Token');
    const tokenText = MarkdownHelper.monospaced(token.accessToken);

    return `${tokenMsg}:\n${tokenText}`;
  }
}
