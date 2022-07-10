import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Integration,
  IntegrationDocument,
} from '@schemas/integration/integration.schema';
import { IntegrationCompany } from '@schemas/integration';

@Injectable()
export class IntegrationSeed {
  constructor(
    @InjectModel(Integration.name)
    private integrationModel: Model<IntegrationDocument>,
  ) {}

  @Command({ command: 'create:integrations', describe: 'create integrations' })
  async create() {
    const integration = new this.integrationModel({
      company: IntegrationCompany.Microtron,
    });
    await integration.save();
    console.log('SAVED: integration => ', integration);
  }
}
