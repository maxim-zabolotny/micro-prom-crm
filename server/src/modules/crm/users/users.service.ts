import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User, UserModel } from '@schemas/user';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class CrmUsersService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: UserModel,
  ) {}

  // MAIN
  public async getAllUsers() {
    return this.userModel.getAllUsers();
  }
}
