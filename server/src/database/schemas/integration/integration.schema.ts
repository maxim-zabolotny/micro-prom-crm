import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Schema as MongooseSchema } from 'mongoose';
import { IntegrationCompany } from '@schemas/integration/integration-company.enum';
import { HttpException, HttpStatus, Logger, Type } from '@nestjs/common';

// MONGOOSE
export type IntegrationDocument = Integration & Document;

export type IntegrationModel = Model<IntegrationDocument> & TStaticMethods;

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

export const IntegrationSchema = SchemaFactory.createForClass(
  Integration,
) as unknown as MongooseSchema<Type<Integration>, IntegrationModel>;

// CUSTOM TYPES
type TStaticMethods = {
  getMicrotronIntegration: (
    this: IntegrationModel,
  ) => Promise<IntegrationDocument>;
};

// STATIC METHODS IMPLEMENTATION
const integrationLogger = new Logger('ConstantModel');

IntegrationSchema.statics.getMicrotronIntegration = async function () {
  integrationLogger.debug('Load Microtron Integration from DB');

  const microtronIntegration = await this.findOne({
    company: IntegrationCompany.Microtron,
  }).exec();
  if (!microtronIntegration) {
    throw new HttpException(
      'No saved microtron integration in DB',
      HttpStatus.BAD_REQUEST,
    );
  }

  return microtronIntegration;
} as TStaticMethods['getMicrotronIntegration'];
