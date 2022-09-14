import {
  Controller,
  Get,
  HttpCode,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { LoggingInterceptor } from '@common/interceptors';
import { MongoExceptionFilter } from '@common/filters';
import { CrmUsersService } from './users.service';
import { Auth, CurrentUser } from '@common/decorators';
import { UserDocument, UserRole } from '@schemas/user';

@Controller('/crm/users')
@UseFilters(MongoExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class CrmUsersController {
  constructor(private readonly crmUsersService: CrmUsersService) {}

  @Get('/all')
  @HttpCode(200)
  @Auth(UserRole.Admin)
  async getAllUsers() {
    return this.crmUsersService.getAllUsers();
  }

  @Get('/current')
  @HttpCode(200)
  @Auth(UserRole.General)
  async getCurrentUser(@CurrentUser() currentUser: UserDocument) {
    return currentUser;
  }
}
