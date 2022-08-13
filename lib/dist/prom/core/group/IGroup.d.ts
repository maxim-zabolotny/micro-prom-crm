import { IPagination } from '../types/api';
export interface IGroup {
    id: number;
    name: string;
    description: string;
    image: string;
    parent_group_id: number | null;
}
export interface IGetGroupsListQueryParams extends Partial<IPagination> {
}
export declare type TGetGroupsListResponse = Record<'groups', IGroup[]>;
