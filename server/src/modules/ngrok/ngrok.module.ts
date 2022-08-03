/*external modules*/
import { Global, Module } from '@nestjs/common';
/*modules*/
/*services*/
import { NgrokService } from './ngrok.service';
/*controllers*/
/*@common*/

/*other*/

@Global()
@Module({
  providers: [NgrokService],
  exports: [NgrokService],
})
export class NgrokModule {}
