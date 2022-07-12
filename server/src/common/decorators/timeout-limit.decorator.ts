import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { Timeout } from '@common/decorators/timeout.decorator';
import { TimeoutInterceptor } from '@common/interceptors';

export function TimeoutLimit(time: number) {
  return applyDecorators(Timeout(time), UseInterceptors(TimeoutInterceptor));
}
