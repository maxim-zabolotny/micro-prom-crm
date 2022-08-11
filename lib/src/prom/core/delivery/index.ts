/*external modules*/
import urlJoin from 'url-join';
/*lib*/
import { HttpMethods, Request } from '../request';
/*types*/
import { IPostSaveDeliveryDeclarationBody, TPostSaveDeliveryDeclarationResponse } from './IDelivery';
/*other*/

export {
  IPostSaveDeliveryDeclarationBody,

  TPostSaveDeliveryDeclarationResponse,
};

export class Delivery extends Request {
  protected buildUrl(path: string | number): string {
    return urlJoin(Delivery.BASE_PATH, String(path));
  }

  public async saveDeclaration(
    data: IPostSaveDeliveryDeclarationBody,
  ): Promise<TPostSaveDeliveryDeclarationResponse> {
    const { body } = await this.makeRequest<IPostSaveDeliveryDeclarationBody, {}, TPostSaveDeliveryDeclarationResponse>(
      HttpMethods.Post,
      this.buildUrl('save_declaration_id'),
      data,
      {},
    );

    return body;
  }

  public static readonly BASE_PATH = 'delivery';
}
