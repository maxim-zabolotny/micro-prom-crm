import { Command, Ctx, Help, InjectBot, Start, Update } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { CrmBotService } from './crm-bot.service';
import { TelegrafExceptionFilter } from '../common/filters';
import { UseFilters } from '@nestjs/common';
import { CurrentTelegramUser } from '../common/decorators';
import { TTelegramUser } from '../common/types';

@Update()
@UseFilters(TelegrafExceptionFilter)
export class CrmBotUpdate {
  constructor(
    @InjectBot()
    private readonly bot: Telegraf<Context>,
    private readonly crmBotService: CrmBotService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context): Promise<string> {
    return `Бот запущен`;
  }

  @Help()
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
  async onGetAuthTokenCommand(
    @CurrentTelegramUser() tgUser: TTelegramUser,
    @Ctx() ctx: Context,
  ): Promise<void> {
    const message = await this.crmBotService.getAuthToken(tgUser.telegramId);
    await ctx.replyWithMarkdown(message);
  }

  @Command('get_client_url')
  async onGetClientUrlCommand(@Ctx() ctx: Context): Promise<void> {
    const message = this.crmBotService.getClientUrl();
    await ctx.replyWithMarkdown(message);
  }

  @Command('get_server_url')
  async onGetServerUrlCommand(@Ctx() ctx: Context): Promise<void> {
    const message = await this.crmBotService.getServerUrl();
    await ctx.replyWithMarkdown(message);
  }

  // @Action(MarkupCallbackButtonName.MarkAsVisited)
  // async onChangeVisitStatusCommand(@Ctx() ctx: Context): Promise<void> {
  //   await this.notificationBotService.updateVisitStatus(ctx);
  // }
}
