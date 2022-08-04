import * as _ from 'lodash';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MicrotronAPI, { Course } from '@lib/microtron';

type ICourse = Course.ICourse;

@Injectable()
export class MicrotronCoursesService {
  private readonly logger = new Logger(this.constructor.name);

  private readonly coursesAPI: Course.Course;
  private coursesCache: ICourse | null = null;

  constructor(private configService: ConfigService) {
    this.coursesAPI = new MicrotronAPI.Course({
      token: configService.get('tokens.microtron'),
    });
  }

  private async retrieveCoursesFromAPI(): Promise<ICourse> {
    const courses = await this.coursesAPI.getCourse();
    this.coursesCache = courses;

    this.logger.debug('Loaded courses from Microtron:', {
      courses,
    });

    return courses;
  }

  public async getCoursesByAPI(force: boolean): Promise<ICourse> {
    const cacheIsEmpty = _.isEmpty(this.coursesCache);

    this.logger.debug('Load courses from API', {
      force,
      cacheIsEmpty,
    });

    if (force || cacheIsEmpty) {
      return this.retrieveCoursesFromAPI();
    }

    this.logger.debug('Took Microtron courses from cache:', {
      courses: this.coursesCache,
    });

    return this.coursesCache;
  }
}
