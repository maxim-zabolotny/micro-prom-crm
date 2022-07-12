/*external modules*/
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
/*modules*/
/*services*/
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@schemas/user';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
/*controllers*/
/*@common*/

/*other*/

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const secret = configService.get('jwtToken.secret');
        const expiresIn = configService.get('jwtToken.expireMinutes');

        return {
          secret,
          signOptions: {
            expiresIn: `${expiresIn}m`,
          },
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
