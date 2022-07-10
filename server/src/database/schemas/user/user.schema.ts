import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Token } from '@schemas/token';
import { UserRole } from '@schemas/user/user-role.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ type: Number, isRequired: true })
  telegramId: number;

  @Prop({ type: Number, isRequired: true })
  chatId: number;

  @Prop({ type: String, isRequired: true })
  name: string;

  @Prop({ type: String })
  username: string;

  @Prop({
    type: String,
    unique: true,
    isRequired: true,
    enum: [...Object.values(UserRole)],
  })
  role: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'token', isRequired: true })
  token: Token;
}

export const UserSchema = SchemaFactory.createForClass(User);
