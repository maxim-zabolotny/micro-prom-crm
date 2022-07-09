import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Integration,
  IntegrationDocument,
} from '@schemas/integration/integration.schema';
import { IntegrationWith } from '@schemas/integration/integration-with.enum';

@Injectable()
export class IntegrationSeed {
  constructor(
    @InjectModel(Integration.name)
    private integrationModel: Model<IntegrationDocument>,
  ) {}

  @Command({ command: 'create:integration', describe: 'create a integration' })
  async create() {
    const integration = new this.integrationModel({
      with: IntegrationWith.Microtron,
    });
    await integration.save();
    console.log('SAVED: integration => ', integration);
  }
}
