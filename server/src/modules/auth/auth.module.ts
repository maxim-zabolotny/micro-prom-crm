/*external modules*/
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
/*modules*/
/*services*/
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Token, TokenSchema } from '@schemas/token';
/*controllers*/
/*@common*/
/*other*/

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      {
        name: Token.name,
        schema: TokenSchema,
      },
    ]),
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
