import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Data } from '../../data';
import { User, UserDocument } from '@schemas/user';

@Injectable()
export class ReloadUsersCommand {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  @Command({
    command: 'reload:users',
    describe: 'reload users from file',
  })
  async reload() {
    const users = await Data.Users.read();

    await this.userModel.deleteMany({});
    console.debug('RELOAD: delete all users');

    await Promise.all(
      users.map(async (userData) => {
        const user = new this.userModel(userData);
        await user.save();
        console.debug('RELOAD: add user => ', user);
      }),
    );
  }
}
