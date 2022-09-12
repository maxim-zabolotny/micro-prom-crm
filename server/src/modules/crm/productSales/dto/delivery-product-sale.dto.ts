import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { Types as PromTypes } from '@lib/prom';

export class DeliveryProductSaleDto {
  @IsString()
  @IsNotEmpty()
  productSaleId: string;

  @IsIn([PromTypes.DeliveryProvider.NovaPoshta])
  @IsNotEmpty()
  provider: PromTypes.DeliveryProvider.NovaPoshta;

  @IsString()
  @IsNotEmpty()
  declarationId: string;
}
