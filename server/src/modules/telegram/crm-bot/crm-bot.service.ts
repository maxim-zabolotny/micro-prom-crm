import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '@schemas/user';
import { Model } from 'mongoose';
import { TTelegramUser } from '../common/types';
import { TelegrafException } from 'nestjs-telegraf';
import { MarkdownHelper } from '../common/helpers';
import { AuthService } from '../../auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { NgrokService } from '../../ngrok/ngrok.service';

@Injectable()
export class CrmBotService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly ngrokService: NgrokService,
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

  public getClientUrl() {
    const url = this.configService.get('client.url');

    const urlMsg = MarkdownHelper.bold('URL');
    const urlText = MarkdownHelper.monospaced(url);

    return `${urlMsg}: ${urlText}`;
  }

  public async getServerUrl() {
    const url = await this.ngrokService.connect({
      port: this.configService.get('port'),
    });

    const urlMsg = MarkdownHelper.bold('URL');
    const urlText = MarkdownHelper.monospaced(url);

    return `${urlMsg}: ${urlText}`;
  }
}
