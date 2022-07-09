import {
  Command,
  Ctx,
  Hears,
  Start,
  Update,
  Sender,
  InjectBot,
  Help,
  Message,
  On,
} from 'nestjs-telegraf';
import { UpdateType as TelegrafUpdateType } from 'telegraf/typings/telegram-types';
import { UpdateType } from '../common/decorators/update-type.decorator';
import { Context, Scenes, Telegraf } from 'telegraf';
import { CrmService } from './crm.service';

@Update()
// @UseInterceptors(ResponseTimeInterceptor)
// @UseFilters(TelegrafExceptionFilter)
export class CrmUpdate {
  constructor(
    @InjectBot()
    private readonly bot: Telegraf<Context>,
    private readonly crmService: CrmService,
  ) {
    // bot.start((ctx) => ctx.reply('Бот запущен.'));
  }

  @Start()
  async onStart(): Promise<string> {
    // const me = await this.bot.telegram.getMe();
    return `Бот запущен`;
  }

  @Help()
  async onHelp(): Promise<string> {
    return 'Пусто';
  }

  // @Command('admin')
  // @UseGuards(AdminGuard)
  // onAdminCommand(): string {
  //   return 'Welcome judge';
  // }

  // @On('text')
  // onMessage(
  //   @Message(/*'text', new ReverseTextPipe()*/) reversedText: string,
  // ): string {
  //   return this.crmService.echo(reversedText);
  // }

  // @Hears(['hi', 'hello', 'hey', 'qq'])
  // onGreetings(
  //   @UpdateType() updateType: TelegrafUpdateType,
  //   @Sender('first_name') firstName: string,
  // ): string {
  //   return `Hey ${firstName}`;
  // }

  // @Command('scene')
  // async onSceneCommand(@Ctx() ctx: Scenes.SceneContext): Promise<void> {
  //   await ctx.scene.enter('HELLO_SCENE_ID');
  // }
}
