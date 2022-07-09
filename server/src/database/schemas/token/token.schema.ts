import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TokenLevel } from '@schemas/token/token.level';

export type TokenDocument = Token & Document;

@Schema({ timestamps: true, collection: 'tokens' })
export class Token {
  @Prop({
    type: String,
    isRequired: true,
    enum: [...Object.values(TokenLevel)],
  })
  level: TokenLevel;

  @Prop({ type: String, isRequired: true })
  data: string;

  @Prop({ type: Date, isRequired: true })
  expireIn: Date;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
