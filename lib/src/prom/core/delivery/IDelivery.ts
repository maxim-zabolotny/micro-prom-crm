// ENTITY
import { DeliveryProvider } from '../types/api';

// REQUEST
export interface IPostSaveDeliveryDeclarationBody {
  order_id: number;
  declaration_id: string;
  delivery_type: Extract<DeliveryProvider,
    | DeliveryProvider.NovaPoshta
    | DeliveryProvider.Justin
    | DeliveryProvider.Meest>;
}

// RESPONSE
export type TPostSaveDeliveryDeclarationResponse = Record<'status', 'success'>
