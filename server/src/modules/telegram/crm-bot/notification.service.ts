import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Markup, Telegraf } from 'telegraf';
import * as _ from 'lodash';
import { ISendNotification } from '@common/interfaces/telegram';
import { MarkdownHelper } from '../common/helpers';

@Injectable()
export class NotificationBotService {
  constructor(
    @InjectBot()
    private readonly bot: Telegraf<Context>,
  ) {}

  private buildButtonWithUrl(title: string, url: string) {
    return Markup.inlineKeyboard([
      Markup.button.url(title, url),
      // Markup.button.callback(
      //   'Пометить как выполненое',
      //   MarkupCallbackButtonName.MarkAsVisited,
      // ),
    ]);
  }

  private buildMessage(data: Omit<ISendNotification, 'button'>) {
    const notificationTitle = MarkdownHelper.bold('Новое уведомление:');

    const titleMessage = MarkdownHelper.italic('Заголовок: ');
    const titleDescription = MarkdownHelper.bold(data.title);

    let message = `${notificationTitle}\n\n${titleMessage}${titleDescription}`;

    if (!_.isEmpty(data.details)) {
      const detailsMessage = MarkdownHelper.italic('Детали: ');
      const detailsDescription = data.details
        .map((detail) => {
          const key = MarkdownHelper.bold(detail[0]);
          const value = detail[1];

          return `${key}: ${value}`;
        })
        .join('\n');

      message += `\n\n${detailsMessage}\n${detailsDescription}`;
    }

    return message;
  }

  private async updateVisitStatus(ctx: Context) {
    const message: string = _.get(ctx, [
      'update',
      'callback_query',
      'message',
      'text',
    ]);
    if (message) {
      const updatedMessage = message.replace('Выполнено: ❌', 'Выполнено: ✔');
      await ctx.editMessageText(updatedMessage);
    }
  }

  public async send(data: ISendNotification) {
    await this.bot.telegram.sendMessage(data.to, this.buildMessage(data), {
      parse_mode: 'MarkdownV2',
      ...(data.button ? this.buildButtonWithUrl(...data.button) : null),
    });
  }
}
