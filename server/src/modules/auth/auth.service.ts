/*external modules*/
import * as crypto from 'crypto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Token, TokenDocument, TokenLevel } from '@schemas/token';
import { IVerifyTokenResult } from '@common/interfaces/token';
/*services*/
/*@common*/
/*@entities*/

/*@interfaces*/

@Injectable()
export class AuthService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
  ) {}

  public generateAuthTokenData(key: string) {
    return crypto
      .createHmac('sha256', this.configService.get('token.secret'))
      .update(key)
      .digest('hex');
  }

  public async generateAuthToken(level: TokenLevel): Promise<TokenDocument> {
    const key = crypto.randomBytes(32).toString('hex');
    const data = this.generateAuthTokenData(key);

    const expireMinutes = this.configService.get<number>('token.expireMinutes');
    const expireTime = 1000 * 60 * expireMinutes;
    const expireIn = new Date().valueOf() + expireTime;

    const token = new this.tokenModel({
      level,
      key,
      data,
      expireIn,
    });
    await token.save();

    return token.toObject();
  }

  public async verifyAuthToken(
    tokenId: Types.ObjectId,
  ): Promise<IVerifyTokenResult> {
    const token = await this.tokenModel.findById(tokenId).exec();
    if (!token) {
      throw new NotFoundException({ tokenId }, 'Token not found!');
    }

    const isExpired = token.expireIn >= new Date().valueOf();
    const isCorrect = token.data === this.generateAuthTokenData(token.key);

    return {
      isExpired,
      isCorrect,
      isValid: isExpired && isCorrect,
    };
  }
}
