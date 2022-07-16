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
      '/getAuthToken - Получить токен аутентификации',
      '/getClientUrl - Получить URL клиента',
      '/getServerUrl - Получить URL сервера',
    ].join('\n');
    const description = [
      'URL клиента это ссылка на CRM сайт',
      'Токен аутентификации используеться на стороне клиента',
      'URL сервера также используеться на стороне клиента',
    ].join('\n');

    return `${commands}\n\n${description}`;
  }

  @Command('getAuthToken')
  async onGetAuthTokenCommand(
    @CurrentTelegramUser() tgUser: TTelegramUser,
    @Ctx() ctx: Context,
  ): Promise<void> {
    const message = await this.crmBotService.getAuthToken(tgUser.telegramId);
    await ctx.replyWithMarkdown(message);
  }

  @Command('getClientUrl')
  async onGetClientUrlCommand(@Ctx() ctx: Context): Promise<void> {
    const message = this.crmBotService.getClientUrl();
    await ctx.replyWithMarkdown(message);
  }

  @Command('getServerUrl')
  async onGetServerUrlCommand(@Ctx() ctx: Context): Promise<void> {
    const message = await this.crmBotService.getServerUrl();
    await ctx.replyWithMarkdown(message);
  }
}
