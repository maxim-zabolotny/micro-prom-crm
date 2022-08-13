import { Request } from '../request';
import { IPaymentOption, TGetPaymentOptionsListResponse } from './IPaymentOption';
export { IPaymentOption, TGetPaymentOptionsListResponse, };
export declare class PaymentOption extends Request {
    protected buildUrl(path: string | number): string;
    getList(): Promise<TGetPaymentOptionsListResponse>;
    static readonly BASE_PATH = "payment_options";
}
