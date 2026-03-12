import { IsEnum, IsMongoId } from 'class-validator';
import { PaymentMethod } from '../schemas/payment.schema';

export class CreatePaymentDto {
  @IsMongoId()
  bookingId: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}
