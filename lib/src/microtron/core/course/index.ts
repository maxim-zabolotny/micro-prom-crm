/*external modules*/
/*lib*/
import { Request } from '../request';
/*types*/
import { ICourse, ICourseRaw } from './ICourse';
import { IResponseRaw } from '../request/IResponse';
/*other*/

export type TEntity = ICourse;
export type TRawEntity = ICourseRaw;

export class Course extends Request<TEntity, TRawEntity> {
  protected parseResult(data: IResponseRaw<TRawEntity>) {
    const { data: responseData, ...responseFields } = super.parseData(data);

    return {
      ...responseFields,
      data: {
        bank: Number(responseData.m),
        street: Number(responseData.s),
      },
    };
  }

  public async getCourse(): Promise<TEntity> {
    return Request.requestWrapper(Course, this, {});
  }

  static readonly PATH = 'courses';
}
