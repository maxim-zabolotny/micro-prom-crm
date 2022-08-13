import { Request } from '../request';
import { IPostSaveDeliveryDeclarationBody, TPostSaveDeliveryDeclarationResponse } from './IDelivery';
export { IPostSaveDeliveryDeclarationBody, TPostSaveDeliveryDeclarationResponse, };
export declare class Delivery extends Request {
    protected buildUrl(path: string | number): string;
    saveDeclaration(data: IPostSaveDeliveryDeclarationBody): Promise<TPostSaveDeliveryDeclarationResponse>;
    static readonly BASE_PATH = "delivery";
}
