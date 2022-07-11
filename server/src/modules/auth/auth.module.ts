/*external modules*/
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
/*modules*/
/*services*/
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Token, TokenSchema } from '@schemas/token';
import { User, UserSchema } from '@schemas/user';
import { PassportModule } from '@nestjs/passport';
import { TokenStrategy } from './strategies/token.strategy';
/*controllers*/
/*@common*/

/*other*/

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    MongooseModule.forFeature([
      {
        name: Token.name,
        schema: TokenSchema,
      },
    ]),
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  providers: [AuthService, TokenStrategy],
  exports: [AuthService, TokenStrategy],
})
export class AuthModule {}
