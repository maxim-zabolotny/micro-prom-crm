import {
  Command,
  Ctx,
  Help,
  InjectBot,
  Next,
  On,
  Start,
  Update,
} from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { CrmBotService } from './crm-bot.service';
import { TelegrafExceptionFilter } from '../common/filters';
import { Logger, UseFilters } from '@nestjs/common';
import { CurrentTelegramUser, TelegramAuth } from '../common/decorators';
import { TTelegramUser } from '../common/types';
import { UserRole } from '@schemas/user';

@Update()
// @UseInterceptors(TelegramLoggingInterceptor)
@UseFilters(TelegrafExceptionFilter)
export class CrmBotUpdate {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectBot()
    private readonly bot: Telegraf<Context>,
    private readonly crmBotService: CrmBotService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context): Promise<string> {
    return `Бот запущен`;
  }

  @On('message')
  async onMessage(@Ctx() ctx: Context, @Next() next): Promise<void> {
    const message = ctx.update['message'];
    this.logger.log('Telegram Bot Message:', {
      from: {
        id: message.from.id,
        firstName: message.from.first_name,
        username: message.from.username,
      },
      data: {
        text: message.text,
      },
    });

    return next();
  }

  @Help()
  @TelegramAuth(UserRole.General)
  async onHelp(): Promise<string> {
    const commands = [
      '/get_auth_token - Получить токен аутентификации',
      '/get_client_url - Получить URL клиента',
      '/get_server_url - Получить URL сервера',
    ].join('\n');
    const description = [
      'URL клиента это ссылка на CRM сайт',
      'Токен аутентификации используеться на стороне клиента',
      'URL сервера также используеться на стороне клиента',
    ].join('\n');

    return `${commands}\n\n${description}`;
  }

  @Command('get_auth_token')
  @TelegramAuth(UserRole.General)
  async onGetAuthTokenCommand(
    @CurrentTelegramUser() tgUser: TTelegramUser,
    @Ctx() ctx: Context,
  ): Promise<void> {
    const message = await this.crmBotService.getAuthToken(tgUser.telegramId);
    await ctx.replyWithMarkdown(message);
  }

  @Command('get_client_url')
  @TelegramAuth(UserRole.General)
  async onGetClientUrlCommand(@Ctx() ctx: Context): Promise<void> {
    const message = this.crmBotService.getClientUrl();
    await ctx.replyWithMarkdown(message);
  }

  @Command('get_server_url')
  @TelegramAuth(UserRole.General)
  async onGetServerUrlCommand(@Ctx() ctx: Context): Promise<void> {
    const message = await this.crmBotService.getServerUrl();
    await ctx.replyWithMarkdown(message);
  }

  @Command('get_login_url')
  @TelegramAuth(UserRole.General)
  async onGetLoginUrlCommand(
    @CurrentTelegramUser() tgUser: TTelegramUser,
    @Ctx() ctx: Context,
  ): Promise<void> {
    const message = await this.crmBotService.getLoginUrl(tgUser.telegramId);
    await ctx.replyWithMarkdown(message);
  }

  // @Action(MarkupCallbackButtonName.MarkAsVisited)
  // async onChangeVisitStatusCommand(@Ctx() ctx: Context): Promise<void> {
  //   await this.notificationBotService.updateVisitStatus(ctx);
  // }
}
