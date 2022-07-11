import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';
import { Types } from 'mongoose';
import { AuthService } from '../auth.service';
import { UserDocument } from '@schemas/user';

@Injectable()
export class TokenStrategy extends PassportStrategy(Strategy, 'token') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(request: Request): Promise<UserDocument> {
    const tokenRawId = request.headers['x-token-id'] as string;
    if (!tokenRawId) {
      throw new UnauthorizedException();
    }

    const tokenId = new Types.ObjectId(tokenRawId);

    const verifyResult = await this.authService.verifyAuthToken(tokenId);
    if (!verifyResult.isValid) {
      throw new UnauthorizedException(verifyResult, 'Token is not valid');
    }

    const user = await this.authService.getUserByToken(tokenId);

    return user;
  }
}
