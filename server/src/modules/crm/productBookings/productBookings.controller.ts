import { Controller, UseFilters, UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { MongoExceptionFilter } from '@common/filters';
import { CrmProductBookingsService } from './productBookings.service';

@Controller('/crm/product-bookings')
@UseFilters(MongoExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class CrmProductBookingsController {
  constructor(
    private readonly crmProductBookingsService: CrmProductBookingsService,
  ) {}
}
