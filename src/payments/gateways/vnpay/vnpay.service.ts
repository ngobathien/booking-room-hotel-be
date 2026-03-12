import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import {
  Booking,
  BookingDocument,
  BookingStatus,
} from '@/bookings/schemas/booking.schema';
import { Model } from 'mongoose';

import * as qs from 'qs';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import {
  Payment,
  PaymentDocument,
  PaymentStatus,
} from '../../schemas/payment.schema';
import { MailService } from '@/services/mail.service';

@Injectable()
export class VnpayService {
  constructor(
    private configService: ConfigService,

    // thêm MailService
    private mailService: MailService,

    @InjectModel(Booking.name)
    private bookingModel: Model<BookingDocument>,

    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,
  ) {}

  // ========================= VNPAY ================================
  private formatDate(date: Date) {
    return date
      .toISOString()
      .replace(/[-:TZ.]/g, '')
      .slice(0, 14);
  }

  private formatDateTimeVN(date: Date) {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }
  private sortObject(obj: any) {
    const sorted = {};
    const keys = Object.keys(obj).sort();

    keys.forEach((key) => {
      sorted[key] = obj[key];
    });

    return sorted;
  }

  //
  createVNPayPayment(booking: BookingDocument, paymentId: string, ip: string) {
    // Dùng non-null assertion !
    // const tmnCode = this.configService.get<string>('VNP_TMN_CODE')!;
    // const secretKey = this.configService.get<string>('VNP_HASH_SECRET')!;
    // const vnpUrl = this.configService.get<string>('VNP_URL')!;
    // const returnUrl = this.configService.get<string>('VNP_RETURN_URL')!;

    const tmnCode = process.env.VNP_TMN_CODE!;
    const secretKey = process.env.VNP_HASH_SECRET!;
    const vnpUrl = process.env.VNP_URL!;
    const returnUrl = process.env.VNP_RETURN_URL!;

    const date = new Date();

    const createDate = this.formatDate(date);

    const orderId = paymentId;
    const amount = Number(booking.totalPrice) * 100;

    let vnpParams: Record<string, any> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Booking_${booking._id.toString()}`,
      vnp_OrderType: 'other',
      vnp_Amount: amount,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ip || '127.0.0.1',
      vnp_CreateDate: createDate,
    };

    vnpParams = this.sortObject(vnpParams);

    const signData = qs.stringify(vnpParams);

    const hmac = crypto.createHmac('sha512', secretKey);

    const signed = hmac.update(Buffer.from(signData)).digest('hex');
    // console.log('signData', signData);
    // console.log('hmac', hmac);
    // console.log('signed', signed);
    vnpParams['vnp_SecureHash'] = signed;

    const paymentUrl = vnpUrl + '?' + qs.stringify(vnpParams);
    console.log(paymentUrl);

    // return { paymentUrl };
    return paymentUrl;
  }

  private formatDateVN(date: Date) {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  }

  //
  async vnpayReturn(query: any) {
    const secureHash = query.vnp_SecureHash;

    delete query.vnp_SecureHash;
    delete query.vnp_SecureHashType;

    const sortedParams = this.sortObject(query);

    const signData = qs.stringify(sortedParams, { encode: false });

    const secretKey = this.configService.get<string>('VNP_HASH_SECRET')!;

    const signed = crypto
      .createHmac('sha512', secretKey)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    if (secureHash !== signed) {
      return { message: 'Invalid checksum' };
    }

    const paymentId = query.vnp_TxnRef;

    const payment = await this.paymentModel.findById(paymentId);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (query.vnp_ResponseCode === '00') {
      payment.status = PaymentStatus.SUCCESS;
      payment.transactionId = query.vnp_TransactionNo;

      await payment.save();

      const booking = await this.bookingModel
        .findByIdAndUpdate(
          payment.booking,
          { bookingStatus: BookingStatus.CONFIRMED },
          { new: true },
        )
        .populate('user', 'email fullName');

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      const user: any = booking.user;

      console.log('booking', booking);
      console.log('User email:', user.email);
      const checkIn = this.formatDateVN(booking.checkInDate) + ' - 14:00';
      const checkOut = this.formatDateVN(booking.checkOutDate) + ' - 12:00';

      // gửi mail cho user sau khi thanh toán thành công
      if (user?.email) {
        await this.mailService.sendBookingSuccessEmail(
          user.email,
          booking._id.toString(),
          booking.bookingCode,
          'Your Hotel',
          checkIn,
          checkOut,
          booking.totalPrice,
        );
      }
      return { message: 'Payment success' };
    }

    payment.status = PaymentStatus.FAILED;
    await payment.save();

    return { message: 'Payment failed' };
  }

  async vnpayIpn(query: any) {
    const secureHash = query.vnp_SecureHash;

    delete query.vnp_SecureHash;
    delete query.vnp_SecureHashType;

    const sortedParams = this.sortObject(query);

    const signData = qs.stringify(sortedParams, { encode: false });

    const secretKey = this.configService.get<string>('VNP_HASH_SECRET')!;

    const signed = crypto
      .createHmac('sha512', secretKey)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    if (secureHash !== signed) {
      return { RspCode: '97', Message: 'Invalid checksum' };
    }

    const paymentId = query.vnp_TxnRef;

    const payment = await this.paymentModel.findById(paymentId);

    if (!payment) {
      return { RspCode: '01', Message: 'Payment not found' };
    }

    if (payment.status !== PaymentStatus.PENDING) {
      return { RspCode: '02', Message: 'Payment already processed' };
    }

    if (query.vnp_ResponseCode === '00') {
      payment.status = PaymentStatus.SUCCESS;
      payment.transactionId = query.vnp_TransactionNo;
      await payment.save();

      await this.bookingModel.findByIdAndUpdate(payment.booking, {
        bookingStatus: BookingStatus.CONFIRMED,
      });

      return { RspCode: '00', Message: 'Confirm Success' };
    }

    payment.status = PaymentStatus.FAILED;
    await payment.save();

    return { RspCode: '00', Message: 'Confirm Success' };
  }

  findAll() {
    return `This action returns all payments`;
  }
}
