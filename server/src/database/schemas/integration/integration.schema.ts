import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IntegrationCompany } from '@schemas/integration/integration-company.enum';

export type IntegrationDocument = Integration & Document;

@Schema({ timestamps: true, collection: 'integrations' })
export class Integration {
  @Prop({
    type: String,
    unique: true,
    required: true,
    enum: [...Object.values(IntegrationCompany)],
  })
  company: IntegrationCompany;
}

export const IntegrationSchema = SchemaFactory.createForClass(Integration);
