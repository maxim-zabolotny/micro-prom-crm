import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserRole } from '@schemas/user';

@Injectable()
export class CrmUsersService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // MAIN
  public getModel() {
    return this.userModel;
  }

  public async getUserByRole(role: UserRole) {
    return this.userModel.find({ role }).exec();
  }

  public async getAllUsers() {
    return this.userModel.find().exec();
  }

  public async getAdmin() {
    return this.getUserByRole(UserRole.Admin);
  }

  public async getProvider() {
    return this.getUserByRole(UserRole.Provider);
  }

  public async getSales() {
    return this.getUserByRole(UserRole.Sales);
  }
}
