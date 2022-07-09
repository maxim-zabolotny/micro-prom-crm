import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TokenLevel } from '@schemas/token/token-level.enum';

export type TokenDocument = Token & Document;

@Schema({ timestamps: true, collection: 'tokens' })
export class Token {
  @Prop({
    type: String,
    unique: true,
    isRequired: true,
    enum: [...Object.values(TokenLevel)],
  })
  level: TokenLevel;

  @Prop({ type: String, isRequired: true })
  key: string;

  @Prop({ type: String, isRequired: true })
  data: string;

  @Prop({ type: Number, isRequired: true })
  expireIn: number;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
