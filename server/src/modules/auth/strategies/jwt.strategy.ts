/*external modules*/
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
/*@interfaces*/
import { IUserDataInJwt } from '@common/interfaces/user';
/*@entities*/
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '@schemas/user';
import { Model, Types } from 'mongoose';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwtToken.secret'),
    });
  }

  async validate(payload: IUserDataInJwt): Promise<UserDocument> {
    const userId = new Types.ObjectId(payload.sub);

    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    return user;
  }
}
