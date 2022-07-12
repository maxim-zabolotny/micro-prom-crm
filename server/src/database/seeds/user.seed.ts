import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '@schemas/user';
import { AuthService } from '../../modules/auth/auth.service';
import { Data } from '../../data';

@Injectable()
export class UserSeed {
  constructor(
    private authService: AuthService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  @Command({ command: 'create:users', describe: 'create users' })
  async create() {
    const users = await Data.Users.read();

    await Promise.all(
      users.map(async (userData) => {
        const user = new this.userModel(userData);
        await user.save();
        console.log('SAVED: user => ', user);
      }),
    );
  }
}
