import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { MongoExceptionFilter } from '@common/filters';
import { CrmProductBookingsService } from './productBookings.service';
import { Auth, CurrentUser } from '@common/decorators';
import { UserDocument, UserRole } from '@schemas/user';
import { CreateProductBookingDto } from './dto/create-product-booking.dto';

@Controller('/crm/product-bookings')
@UseFilters(MongoExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class CrmProductBookingsController {
  constructor(
    private readonly crmProductBookingsService: CrmProductBookingsService,
  ) {}

  @Post('/create')
  @HttpCode(201)
  @Auth(UserRole.Sales)
  createProductBooking(
    @Body() productBookingData: CreateProductBookingDto,
    @CurrentUser() currentUser: UserDocument,
  ) {
    return this.crmProductBookingsService.createProductBooking(
      productBookingData,
      currentUser,
    );
  }
}
