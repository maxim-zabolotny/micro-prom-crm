import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  Query,
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
import { ParseObjectIdPipe } from '@common/pipes';
import { Types } from 'mongoose';
import { ApproveProductBookingDto } from './dto/approve-product-booking.dto';
import { SearchProductBookingsDto } from './dto/search-product-bookings.dto';

@Controller('/crm/product-bookings')
@UseFilters(MongoExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class CrmProductBookingsController {
  constructor(
    private readonly crmProductBookingsService: CrmProductBookingsService,
  ) {}

  @Get('/')
  @HttpCode(200)
  @Auth(UserRole.General)
  async getById(
    @Query('id', ParseObjectIdPipe) productBookingId: Types.ObjectId,
  ) {
    return this.crmProductBookingsService.getById(productBookingId);
  }

  @Post('/search')
  @HttpCode(200)
  @Auth(UserRole.General)
  async search(@Body() findData: SearchProductBookingsDto) {
    return this.crmProductBookingsService.search(findData);
  }

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

  @Put('/approve')
  @HttpCode(201)
  @Auth(UserRole.Provider)
  approveProductBooking(
    @Body() data: ApproveProductBookingDto,
    @CurrentUser() currentUser: UserDocument,
  ) {
    return this.crmProductBookingsService.approveProductBooking(
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
