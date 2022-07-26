import { Request } from '../request';
import { ICourse, ICourseRaw } from './ICourse';
import { IResponseRaw } from '../request/IResponse';
export declare type TEntity = ICourse;
export declare type TRawEntity = ICourseRaw;
export { ICourse, ICourseRaw, };
export declare class Course extends Request<TEntity, TRawEntity> {
    protected parseResult(data: IResponseRaw<TRawEntity>): {
        data: {
            bank: number;
            street: number;
        };
        timestamp: Date;
        status: boolean;
    };
    getCourse(): Promise<TEntity>;
    static readonly PATH = "courses";
}
