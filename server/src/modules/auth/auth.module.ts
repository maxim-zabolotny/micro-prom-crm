/*external modules*/
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
/*modules*/
/*services*/
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@schemas/user';
import { PassportModule } from '@nestjs/passport';
/*controllers*/
/*@common*/

/*other*/

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
