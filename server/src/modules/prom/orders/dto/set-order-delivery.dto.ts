import { IsIn, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Delivery as PromDelivery, Types } from '@lib/prom';

export class SetOrderDeliveryDto
  implements PromDelivery.IPostSaveDeliveryDeclarationBody
{
  @IsNumber()
  @IsNotEmpty()
  order_id: number;

  @IsString()
  @IsNotEmpty()
  declaration_id: string;

  @IsIn([
    Types.DeliveryProvider.NovaPoshta,
    Types.DeliveryProvider.Justin,
    Types.DeliveryProvider.Meest,
  ])
  @IsNotEmpty()
  delivery_type: PromDelivery.IPostSaveDeliveryDeclarationBody['delivery_type'];
}
