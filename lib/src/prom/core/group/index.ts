/*external modules*/
import urlJoin from 'url-join';
/*lib*/
import { HttpMethods, Request } from '../request';
/*types*/
import { IGetGroupsListQueryParams, IGroup, TGetGroupsListResponse } from './IGroup';
/*other*/

export {
  IGroup,

  IGetGroupsListQueryParams,

  TGetGroupsListResponse,
};

export class Group extends Request {
  protected buildUrl(path: string | number): string {
    return urlJoin(Group.BASE_PATH, String(path));
  }

  public async getGroupsList(params: IGetGroupsListQueryParams = {}): Promise<TGetGroupsListResponse> {
    const queryParams = { ...params };

    const { body } = await this.makeRequest<{}, IGetGroupsListQueryParams, TGetGroupsListResponse>(
      HttpMethods.Get,
      this.buildUrl('list'),
      {},
      queryParams,
    );

    return body;
  }

  public static readonly BASE_PATH = 'groups';
}
