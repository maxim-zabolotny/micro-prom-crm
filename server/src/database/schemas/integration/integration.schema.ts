import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IntegrationWith } from '@schemas/integration/integration-with.enum';

export type IntegrationDocument = Integration & Document;

@Schema({ timestamps: true, collection: 'integrations' })
export class Integration {
  @Prop({
    type: String,
    unique: true,
    isRequired: true,
    enum: [...Object.values(IntegrationWith)],
  })
  with: IntegrationWith;
}

export const IntegrationSchema = SchemaFactory.createForClass(Integration);
