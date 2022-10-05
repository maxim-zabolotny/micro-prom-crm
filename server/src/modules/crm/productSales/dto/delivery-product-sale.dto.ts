import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types as PromTypes } from '@lib/prom';

export class DeliveryProductSaleDto {
  @IsString()
  @IsNotEmpty()
  productSaleId: string;

  @IsIn([
    PromTypes.DeliveryProvider.NovaPoshta,
    PromTypes.DeliveryProvider.UkrPoshta,
  ])
  @IsNotEmpty()
  provider:
    | PromTypes.DeliveryProvider.UkrPoshta
    | PromTypes.DeliveryProvider.NovaPoshta;

  @IsString()
  @IsOptional()
  declarationId?: string;
}
