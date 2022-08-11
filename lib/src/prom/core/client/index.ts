/*external modules*/
import urlJoin from 'url-join';
/*lib*/
import { HttpMethods, Request } from '../request';
/*types*/
import {
  IClient, IGetClientsListQueryParams, TGetClientByIdResponse, TGetClientsListResponse,
} from './IClient';
/*other*/

export {
  IClient,

  IGetClientsListQueryParams,

  TGetClientsListResponse,
  TGetClientByIdResponse,
};

export class Client extends Request {
  protected buildUrl(path: string | number): string {
    return urlJoin(Client.BASE_PATH, String(path));
  }

  public async getList(params: IGetClientsListQueryParams = {}): Promise<TGetClientsListResponse> {
    const queryParams = { ...params };

    const { body } = await this.makeRequest<{}, IGetClientsListQueryParams, TGetClientsListResponse>(
      HttpMethods.Get,
      this.buildUrl('list'),
      {},
      queryParams,
    );

    return body;
  }

  public async getById(clientId: number): Promise<TGetClientByIdResponse> {
    const { body } = await this.makeRequest<{}, {}, TGetClientByIdResponse>(
      HttpMethods.Get,
      this.buildUrl(clientId),
      {},
      {},
    );

    return body;
  }

  public static readonly BASE_PATH = 'clients';
}
