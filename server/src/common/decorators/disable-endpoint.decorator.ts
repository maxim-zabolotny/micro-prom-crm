/*external modules*/
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
/*@common*/
import { EndpointDisabledGuard } from '@common/guards';

export function DisableEndpoint() {
  return applyDecorators(
    SetMetadata('isDisable', true),
    UseGuards(EndpointDisabledGuard),
  );
}
