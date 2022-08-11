// ENTITY
export interface IPaymentOption {
  id: number;
  name: string;
  description: string | null;
}

// REQUEST

// RESPONSE
export type TGetPaymentOptionsListResponse = Record<'payment_options', IPaymentOption[]>
