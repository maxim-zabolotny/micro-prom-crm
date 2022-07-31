import * as _ from 'lodash';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MicrotronAPI, { Course } from '@lib/microtron';

type ICourse = Course.ICourse;

@Injectable()
export class CoursesService {
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

    return courses;
  }

  public async getCoursesByAPI(force: boolean): Promise<ICourse> {
    const cacheIsEmpty = _.isEmpty(this.coursesCache);

    this.logger.debug('Load categories from API', {
      force,
      cacheIsEmpty,
    });

    if (force || cacheIsEmpty) {
      return this.retrieveCoursesFromAPI();
    }

    return this.coursesCache;
  }
}