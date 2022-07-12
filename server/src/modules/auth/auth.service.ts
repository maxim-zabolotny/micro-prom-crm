/*external modules*/
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
/*services*/
/*@common*/
/*@entities*/

/*@interfaces*/

@Injectable()
export class AuthService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private configService: ConfigService) {}
}
