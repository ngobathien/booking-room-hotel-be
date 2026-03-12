import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import type { Request } from 'express';
import { VnpayService } from './gateways/vnpay/vnpay.service';
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private vnpayService: VnpayService,
  ) {}

  @Post('create')
  createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: Request,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    return this.paymentsService.createPayment(createPaymentDto, ip);
  }

  @Get('vnpay-ipn')
  vnpayIpn(@Query() query: Record<string, string>) {
    return this.vnpayService.vnpayIpn(query);
  }

  @Get('vnpay-return')
  vnpayReturn(@Query() query: Record<string, string>) {
    return this.vnpayService.vnpayReturn(query);
  }

  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(+id);
  }
}
