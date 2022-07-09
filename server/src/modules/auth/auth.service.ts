/*external modules*/
import _ from 'lodash';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
/*services*/
/*@common*/
/*@entities*/
/*@interfaces*/

@Injectable()
export class AuthService {
  private readonly logger = new Logger(this.constructor.name);

  // constructor(
  //   @InjectRepository(UserEntity)
  //   private usersRepository: Repository<UserEntity>,
  // ) {
  // }
  //
  // private generateAuthToken(user: Pick<UserModel, 'id' | 'email'>) {
  //   // property name of sub need for hold our userId value to be consistent with JWT standards.
  //   const payload = { email: user.email, sub: user.id };
  //
  //   return {
  //     accessToken: this.jwtService.sign(payload),
  //   };
  // }
  //
  // public async checkAuthToken(user: UserEntity, code: number) {
  //   const client = await this.redisService.getConnection();
  //
  //   const verifyCode = await client.get(user.email);
  //   if (!verifyCode)
  //     throw new NotFoundException(
  //       'Verify code not found. Please resend verify code.',
  //     );
  //
  //   if (parseInt(verifyCode, 10) !== code) {
  //     throw new BadRequestException('Invalid verification code');
  //   }
  //
  //   user.verified = true;
  //   await user.save();
  //
  //   this.logger.debug('User verified email', _.pick(user, ['id', 'email']));
  //
  //   return user;
  // }

}
