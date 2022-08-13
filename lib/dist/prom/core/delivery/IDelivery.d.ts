import { DeliveryProvider } from '../types/api';
export interface IPostSaveDeliveryDeclarationBody {
    order_id: number;
    declaration_id: string;
    delivery_type: Extract<DeliveryProvider, DeliveryProvider.NovaPoshta | DeliveryProvider.Justin | DeliveryProvider.Meest>;
}
export declare type TPostSaveDeliveryDeclarationResponse = Record<'status', 'success'>;
