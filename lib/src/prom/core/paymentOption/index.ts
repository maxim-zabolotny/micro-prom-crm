/*external modules*/
import urlJoin from 'url-join';
/*lib*/
import { HttpMethods, Request } from '../request';
/*types*/
import { IPaymentOption, TGetPaymentOptionsListResponse } from './IPaymentOption';
/*other*/

export {
  IPaymentOption,

  TGetPaymentOptionsListResponse,
};

export class PaymentOption extends Request {
  protected buildUrl(path: string | number): string {
    return urlJoin(PaymentOption.BASE_PATH, String(path));
  }

  public async getList(): Promise<TGetPaymentOptionsListResponse> {
    const { body } = await this.makeRequest<{}, {}, TGetPaymentOptionsListResponse>(
      HttpMethods.Get,
      this.buildUrl('list'),
      {},
      {},
    );

    return body;
  }

  public static readonly BASE_PATH = 'payment_options';
}
