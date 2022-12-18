import * as _ from 'lodash';
import * as ms from 'ms';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MicrotronAPI, { Course } from '@lib/microtron';

type ICourse = Course.ICourse;

@Injectable()
export class MicrotronCoursesService {
  private readonly logger = new Logger(this.constructor.name);

  private readonly coursesAPI: Course.Course;

  private coursesCache: ICourse | null = null;
  private coursesLastRequestTimestamp: number | null = null;
  public coursesRequestTolerance: number = ms('5m');

  constructor(private configService: ConfigService) {
    this.coursesAPI = new MicrotronAPI.Course({
      token: configService.get('microtron.otpToken'),
    });
  }

  private async retrieveCoursesFromAPI(): Promise<ICourse> {
    const courses = await this.coursesAPI.getCourse();
    this.coursesCache = courses;

    this.logger.debug('Loaded courses from Microtron:', {
      courses,
    });

    this.coursesLastRequestTimestamp = Date.now();
    return courses;
  }

  public setRequestTolerance(tolerance: number) {
    this.coursesRequestTolerance = tolerance;
  }

  public async getCoursesByAPI(
    force: boolean,
    tolerance = this.coursesRequestTolerance,
  ): Promise<ICourse> {
    const cacheIsEmpty = _.isEmpty(this.coursesCache);

    this.logger.debug('Load courses from API', {
      force,
      cacheIsEmpty,
      tolerance,
    });

    if (cacheIsEmpty) {
      return this.retrieveCoursesFromAPI();
    }

    const cacheIsExpired =
      Date.now() - this.coursesLastRequestTimestamp >= tolerance;
    if (force && cacheIsExpired) {
      return this.retrieveCoursesFromAPI();
    }

    this.logger.debug('Took Microtron courses from cache:', {
      courses: this.coursesCache,
    });

    return this.coursesCache;
  }
}
