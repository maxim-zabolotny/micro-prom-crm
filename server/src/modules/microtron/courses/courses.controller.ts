import {
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  ParseBoolPipe,
  Query,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { MicrotronCoursesService } from './courses.service';
import { MicrotronExceptionFilter } from '@common/filters';
import { TimeoutLimit } from '@common/decorators';
import { LoggingInterceptor } from '@common/interceptors';

@Controller('/microtron/courses')
@UseFilters(MicrotronExceptionFilter)
@UseInterceptors(LoggingInterceptor)
export class MicrotronCoursesController {
  constructor(
    private readonly microtronCoursesService: MicrotronCoursesService,
  ) {}

  @Get('/')
  @HttpCode(200)
  @TimeoutLimit(5000)
  async get(
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe)
    force: boolean,
  ) {
    return this.microtronCoursesService.getCoursesByAPI(force);
  }
}
