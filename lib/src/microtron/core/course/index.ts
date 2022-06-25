/*external modules*/
/*lib*/
import { Request } from '../request';
/*types*/
import { ICourse, ICourseRaw } from './ICourse';
import { IResponse, IResponseRaw } from '../request/IResponse';
/*other*/

export type TEntity = ICourse;
export type TRawEntity = ICourseRaw;

export class Course extends Request {
  private parseResult(data: IResponseRaw<TRawEntity>): IResponse<TEntity> {
    const { data: responseData, ...responseFields } = super.parse<TRawEntity>(data);

    return {
      ...responseFields,
      data: {
        bank: Number(responseData.m),
        street: Number(responseData.s),
      },
    };
  }

  public async getCourse(): Promise<TEntity> {
    try {
      const response = await this.makeRequest<TRawEntity>(Course.PATH);
      return this.parseResult(response.data).data;
    } catch (error) {
      if (process.env.IS_DEBUG) {
        console.log('Course:error => ', error);
      }

      throw error;
    }
  }

  private static PATH = 'courses';
}
