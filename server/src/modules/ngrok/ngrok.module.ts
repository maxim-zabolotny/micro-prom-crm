/*external modules*/
import { Module } from '@nestjs/common';
/*modules*/
/*services*/
import { NgrokService } from './ngrok.service';
/*controllers*/
/*@common*/

/*other*/

@Module({
  providers: [NgrokService],
  exports: [NgrokService],
})
export class NgrokModule {}
