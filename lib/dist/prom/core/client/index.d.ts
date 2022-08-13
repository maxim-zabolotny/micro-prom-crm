import { Request } from '../request';
import { IClient, IGetClientsListQueryParams, TGetClientByIdResponse, TGetClientsListResponse } from './IClient';
export { IClient, IGetClientsListQueryParams, TGetClientsListResponse, TGetClientByIdResponse, };
export declare class Client extends Request {
    protected buildUrl(path: string | number): string;
    getList(params?: IGetClientsListQueryParams): Promise<TGetClientsListResponse>;
    getById(clientId: number): Promise<TGetClientByIdResponse>;
    static readonly BASE_PATH = "clients";
}
