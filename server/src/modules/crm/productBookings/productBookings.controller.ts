import {
  Body,
  Controller,
  HttpCode,
  Post,
  Put,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { MongoExceptionFilter } from '@common/filters';
import { CrmProductBookingsService } from './productBookings.service';
import { Auth, CurrentUser } from '@common/decorators';
import { UserDocument, UserRole } from '@schemas/user';
import { CreateProductBookingDto } from './dto/create-product-booking.dto';
import { DisapproveProductBookingDto } from './dto/disapprove-product-booking.dto';

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
    @Body() data: CreateProductBookingDto,
    @CurrentUser() currentUser: UserDocument,
  ) {
    return this.crmProductBookingsService.createProductBooking(
      data,
      currentUser,
    );
  }

  @Put('/disapprove')
  @HttpCode(201)
  @Auth(UserRole.Provider)
  disapproveProductBooking(
    @Body() data: DisapproveProductBookingDto,
    @CurrentUser() currentUser: UserDocument,
  ) {
    return this.crmProductBookingsService.disapproveProductBooking(
      data,
      currentUser,
    );
  }
}
