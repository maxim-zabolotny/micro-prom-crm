import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';
import { UserRole } from '@schemas/user/user-role.enum';

// MONGOOSE
export type UserDocument = User & Document;

export type UserModel = Model<UserDocument> & TStaticMethods;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({
    type: Number,
    required: true,
    unique: true,
  })
  telegramId: number;

  @Prop({ type: Number, required: true, unique: true })
  chatId: number;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  username?: string;

  @Prop({
    type: String,
    unique: true,
    required: true,
    enum: [...Object.values(UserRole)],
  })
  role: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);

// CUSTOM TYPES
type TStaticMethods = {
  getAllUsers: (this: UserModel) => Promise<UserDocument[]>;
  getByTelegram: (this: UserModel, telegramId: number) => Promise<UserDocument>;
  getUserByRole: (this: UserModel, role: UserRole) => Promise<UserDocument>;
  getAdmin: (this: UserModel) => Promise<UserDocument>;
  getProvider: (this: UserModel) => Promise<UserDocument>;
  getSales: (this: UserModel) => Promise<UserDocument>;
};

UserSchema.statics.getAllUsers = async function () {
  return this.find().exec();
} as TStaticMethods['getAllUsers'];

UserSchema.statics.getByTelegram = async function (telegramId) {
  return this.findOne({
    telegramId,
  }).exec();
} as TStaticMethods['getByTelegram'];

UserSchema.statics.getUserByRole = async function (role) {
  return this.findOne({ role }).exec();
} as TStaticMethods['getUserByRole'];

UserSchema.statics.getAdmin = async function () {
  return this.getUserByRole(UserRole.Admin);
} as TStaticMethods['getAdmin'];

UserSchema.statics.getProvider = async function () {
  return this.getUserByRole(UserRole.Provider);
} as TStaticMethods['getProvider'];

UserSchema.statics.getSales = async function () {
  return this.getUserByRole(UserRole.Sales);
} as TStaticMethods['getSales'];
