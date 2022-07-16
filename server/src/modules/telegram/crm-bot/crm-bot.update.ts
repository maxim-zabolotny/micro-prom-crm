import { Ctx, Help, InjectBot, Start, Update } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { CrmBotService } from './crm-bot.service';
import { AuthService } from '../../auth/auth.service';
import { TelegrafExceptionFilter } from '../common/filters';
import { UseFilters } from '@nestjs/common';

@Update()
@UseFilters(TelegrafExceptionFilter)
export class CrmBotUpdate {
  constructor(
    @InjectBot()
    private readonly bot: Telegraf<Context>,
    private readonly crmBotService: CrmBotService,
    private readonly authService: AuthService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context): Promise<string> {
    return `Бот запущен`;
  }

  @Help()
  async onHelp(): Promise<string> {
    return 'Пусто';
  }
}
