import { IPagination } from '../types/api';
export interface IClient {
    id: number;
    client_full_name: string;
    phones: string[];
    emails: string[];
    comment: string;
    skype: string;
    orders_count: number;
    total_payout: string;
}
export interface IGetClientsListQueryParams extends Partial<IPagination> {
    search_term?: string;
}
export declare type TGetClientsListResponse = Record<'clients', IClient[]>;
export declare type TGetClientByIdResponse = Record<'client', IClient>;
