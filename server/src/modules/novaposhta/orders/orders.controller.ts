import {
  Controller,
  Get,
  HttpCode,
  Query,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { LoggingInterceptor } from '@common/interceptors';
import { NovaposhtaOrdersService } from './orders.service';
import { Auth } from '@common/decorators';
import { UserRole } from '@schemas/user';

@Controller('/novaposhta/orders')
@UseInterceptors(LoggingInterceptor)
export class NovaposhtaOrdersController {
  constructor(
    private readonly novaposhtaOrdersService: NovaposhtaOrdersService,
  ) {}

  @Get('/print-marking')
  @HttpCode(200)
  @Auth(UserRole.General)
  async setDeclaration(
    @Query('declarationId') declarationId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.novaposhtaOrdersService.getPDFPrintMaking(
      declarationId,
    );

    return res.type('application/pdf').status(200).send(buffer);
  }
}
