import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { ProductBooking, ProductBookingModel } from '@schemas/productBooking';

@Injectable()
export class CrmProductBookingsService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    @InjectModel(ProductBooking.name)
    private productBookingModel: ProductBookingModel,
  ) {}
}
