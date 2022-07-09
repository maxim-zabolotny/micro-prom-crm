/*external modules*/
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
/*modules*/
/*services*/
import { AuthService } from './auth.service';
/*controllers*/
/*@common*/
/*other*/

@Module({
  imports: [ConfigModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
