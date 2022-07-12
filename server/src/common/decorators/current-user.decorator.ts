/*external modules*/
import { createParamDecorator } from '@nestjs/common';
/*@interfaces*/
import { User } from '@schemas/user';

export const CurrentUser = createParamDecorator<keyof User>((data, ctx) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  return data ? user?.[data] : user;
});
