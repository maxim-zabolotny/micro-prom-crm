import { Request } from '../request';
import { ICourse, ICourseRaw } from './ICourse';
export declare type TEntity = ICourse;
export declare type TRawEntity = ICourseRaw;
export declare class Course extends Request {
    private parseResult;
    getCourse(): Promise<TEntity>;
    private static PATH;
}
