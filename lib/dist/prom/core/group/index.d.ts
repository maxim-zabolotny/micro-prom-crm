import { Request } from '../request';
import { IGetGroupsListQueryParams, IGroup, TGetGroupsListResponse } from './IGroup';
export { IGroup, IGetGroupsListQueryParams, TGetGroupsListResponse, };
export declare class Group extends Request {
    protected buildUrl(path: string | number): string;
    getList(params?: IGetGroupsListQueryParams): Promise<TGetGroupsListResponse>;
    static readonly BASE_PATH = "groups";
}
