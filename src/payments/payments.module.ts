import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { VnpayService } from './gateways/vnpay/vnpay.service';
import { MailModule } from '../services/mail.module';

@Module({
  imports: [
    MailModule,
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, VnpayService],
})
export class PaymentsModule {}
