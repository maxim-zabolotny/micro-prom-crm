export interface IPaymentOption {
    id: number;
    name: string;
    description: string | null;
}
export declare type TGetPaymentOptionsListResponse = Record<'payment_options', IPaymentOption[]>;
