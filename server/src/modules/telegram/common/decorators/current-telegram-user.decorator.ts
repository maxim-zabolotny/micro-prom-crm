import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { TTelegramUser } from '../types';

export const CurrentTelegramUser = createParamDecorator<keyof TTelegramUser>(
  (dataKey, ctx: ExecutionContext) => {
    const tgCtx = TelegrafExecutionContext.create(ctx).getContext();
    const tgData = {
      telegramId: tgCtx.from.id,
      name: tgCtx.from.first_name,
      username: tgCtx.from.username,
      chatId: tgCtx.chat.id,
    };

    if (dataKey) {
      return tgData[dataKey];
    }

    return tgData;
  },
);
