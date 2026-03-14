import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Booking, BookingDocument } from '@/bookings/schemas/booking.schema';
import { Model } from 'mongoose';
import {
  Payment,
  PaymentDocument,
  PaymentMethod,
  PaymentStatus,
} from './schemas/payment.schema';
import * as qs from 'qs';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { VnpayService } from './gateways/vnpay/vnpay.service';

@Injectable()
export class PaymentsService {
  constructor(
    private configService: ConfigService,
    private vnpayService: VnpayService,

    @InjectModel(Booking.name)
    private bookingModel: Model<BookingDocument>,

    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
  ) {}

  //
  async createPayment(createPaymentDto: CreatePaymentDto, ip: string) {
    const booking = await this.bookingModel.findById(
      createPaymentDto.bookingId,
    );

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const { method } = createPaymentDto;

    // kiểm tra payment pending trước đó
    const existingPayment = await this.paymentModel.findOne({
      booking: booking._id,
      status: PaymentStatus.PENDING,
    });

    if (existingPayment) {
      const created = new Date(existingPayment.createdAt).getTime();
      const now = new Date().getTime();

      const diff = now - created;

      // 15 phút = 900000 ms
      // chưa quá 15 phút → trả lại link cũ
      if (diff < 900000) {
        return {
          paymentUrl: existingPayment.paymentUrl,
        };
      }

      // nếu quá 15 phút thì hủy payment cũ
      existingPayment.status = PaymentStatus.FAILED;
      await existingPayment.save();
    }

    const payment = await this.paymentModel.create({
      booking: booking._id,
      amount: booking.totalPrice,
      method,
      status: PaymentStatus.PENDING,
    });

    switch (method) {
      // ============ VNPAY ==============
      case PaymentMethod.VNPAY: {
        // return this.createVNPayPayment(booking, payment._id.toString(), ip);
        const paymentUrl = this.vnpayService.createVNPayPayment(
          booking,
          payment._id.toString(),
          ip,
        );

        payment.paymentUrl = paymentUrl;
        await payment.save();

        return { paymentUrl };
      }

      case PaymentMethod.MOMO:
      // return this.createMomoPayment(booking);
    }
  }

  findAll() {
    return `This action returns all payments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} payment`;
  }
}
