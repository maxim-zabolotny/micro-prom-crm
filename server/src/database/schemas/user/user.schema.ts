import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '@schemas/user/user-role.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ type: Number, required: true })
  telegramId: number;

  @Prop({ type: Number, required: true })
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
