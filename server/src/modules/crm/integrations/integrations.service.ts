import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  Integration,
  IntegrationCompany,
  IntegrationDocument,
} from '@schemas/integration';

@Injectable()
export class CrmIntegrationsService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    @InjectModel(Integration.name)
    private integrationModel: Model<IntegrationDocument>,
  ) {}

  public async getMicrotronIntegration() {
    this.logger.debug('Load Microtron Integration from DB');

    const microtronIntegration = await this.integrationModel
      .findOne({ company: IntegrationCompany.Microtron })
      .exec();
    if (!microtronIntegration) {
      throw new HttpException(
        'No saved microtron integration in DB',
        HttpStatus.BAD_REQUEST,
      );
    }

    return microtronIntegration;
  }
}
