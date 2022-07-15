/*external modules*/
import { Module } from '@nestjs/common';
/*modules*/
/*services*/
import { NgrokService } from './ngrok.service';
import { ConfigModule } from '@nestjs/config';
/*controllers*/
/*@common*/

/*other*/

@Module({
  imports: [ConfigModule],
  providers: [NgrokService],
  exports: [NgrokService],
})
export class NgrokModule {}
