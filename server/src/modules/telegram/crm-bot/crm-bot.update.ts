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
    return 'Пусто';
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
