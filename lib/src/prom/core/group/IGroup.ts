// ENTITY
import { IPagination } from '../types/api';

export interface IGroup {
  id: number;
  name: string;
  description: string;
  image: string;
  parent_group_id: number | null;
}

// REQUEST
export interface IGetGroupsListQueryParams extends Partial<IPagination> {
}

// RESPONSE
export type TGetGroupsListResponse = Record<'groups', IGroup[]>
