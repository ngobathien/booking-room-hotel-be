import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
// backend/src/services/mail.service.ts
@Injectable()
export class MailService {
  // dịch vụ gửi mail

  private transporter: nodemailer.Transporter;

  private adminSystem = process.env.EMAIL_USER;

  constructor() {
    this.transporter = nodemailer.createTransport({
      //   service: 'gmail', // Hoặc dịch vụ email bạn sử dụng
      //   host: 'smtp.ethereal.email',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use true for port 465, false for port 587
      auth: {
        // user: 'cordell.gibson@ethereal.email',
        // pass: 'qvxXfsJGQnAWBqE6a7',

        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  //   hàm gửi reset password về mail
  async sendPasswordResetEmail(to: string, token: string) {
    const url_client = process.env.URL_CLIENT;
    const resetLink = `${url_client}/reset-password?token=${token}`;

    const mailOptions = {
      from: 'Auth-backend service',
      to: to,
      subject: 'Password Reset Request',

      html: `
        <p>You requested a password reset.</p>
        <p>
          <a href="${resetLink}">Đặt lại mật khẩu</a>
        </p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  // gửi mail cho user sau khi đặt phòng thành công
  async sendBookingSuccessEmail(
    to: string,
    bookingId: string,
    bookingCode: string,
    hotelName: string,
    checkIn: string,
    checkOut: string,
    totalPrice: number,
  ) {
    const mailOptions = {
      from: 'Booking Service',
      to: to,
      subject: 'Booking Confirmation',

      html: `
<div style="font-family: Arial, sans-serif; background:#f5f7fa; padding:20px;">
  <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    
    <div style="background:#0d6efd; color:white; padding:20px; text-align:center;">
      <h2 style="margin:0;">Booking Confirmation 🎉</h2>
      <p style="margin:5px 0 0;">Cảm ơn bạn đã đặt phòng</p>
    </div>

    <div style="padding:25px;">
      
      <p>Xin chào,</p>
      <p>Đặt phòng của bạn đã được <b>xác nhận thành công</b>. Dưới đây là thông tin chi tiết:</p>

      <table style="width:100%; border-collapse:collapse; margin-top:15px;">
        <tr>
          <td style="padding:8px; border-bottom:1px solid #eee;"><b>Booking ID</b></td>
          <td style="padding:8px; border-bottom:1px solid #eee;">${bookingId}</td>
        </tr>

        <tr>
          <td style="padding:8px; border-bottom:1px solid #eee;"><b>Booking Code</b></td>
          <td style="padding:8px; border-bottom:1px solid #eee;">${bookingCode}</td>
        </tr>

        <tr>
          <td style="padding:8px; border-bottom:1px solid #eee;"><b>Hotel</b></td>
          <td style="padding:8px; border-bottom:1px solid #eee;">${hotelName}</td>
        </tr>

        <tr>
          <td style="padding:8px; border-bottom:1px solid #eee;"><b>Check-in</b></td>
          <td style="padding:8px; border-bottom:1px solid #eee;">${checkIn}</td>
        </tr>

        <tr>
          <td style="padding:8px; border-bottom:1px solid #eee;"><b>Check-out</b></td>
          <td style="padding:8px; border-bottom:1px solid #eee;">${checkOut}</td>
        </tr>

        <tr>
          <td style="padding:8px;"><b>Total Price</b></td>
          <td style="padding:8px; color:#e63946; font-weight:bold;">
            ${totalPrice.toLocaleString()} VND
          </td>
        </tr>
      </table>

      <div style="margin-top:25px; padding:15px; background:#f8f9fa; border-radius:6px;">
        <p style="margin:0;">
          Vui lòng giữ lại <b>Booking Code</b> để check-in tại khách sạn.
        </p>
      </div>

      <p style="margin-top:25px;">
        Chúc bạn có chuyến đi tuyệt vời! ✈️
      </p>

    </div>

    <div style="background:#f1f1f1; text-align:center; padding:12px; font-size:13px; color:#777;">
      © 2026 Your Hotel Booking Service
    </div>

  </div>
</div>
`,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendOtpEmail(to: string, otp: string) {
    const urlClient = process.env.URL_CLIENT;
    const verifyPath = process.env.URL_VERIFY_OTP;

    const verifyLink = `${urlClient}${verifyPath}?email=${to}`;

    const otpMail = {
      from: `Khách sạn NBT ${this.adminSystem}`,
      to: to,
      subject: 'Xác thực email - Hotel NBT',
      html: `
      <div style="font-family: Arial, sans-serif; padding:20px; background:#f6f6f6;">
        
        <div style="max-width:500px; margin:auto; background:white; padding:30px; border-radius:8px;">
          
          <h2 style="color:#2c3e50; text-align:center;">
            Hotel NBT
          </h2>

          <p>Xin chào,</p>

          <p>Bạn vừa yêu cầu xác thực email cho tài khoản tại <b>Hotel NBT</b>.</p>

          <p>Mã OTP của bạn là:</p>

          <h1 style="
            text-align:center;
            letter-spacing:5px;
            background:#f1f1f1;
            padding:15px;
            border-radius:6px;
            color:#e74c3c;
          ">
            ${otp}
          </h1>

          <p>Hoặc nhấn link sau để nhập OTP:</p>

          <a href="${verifyLink}">
            Xác thực tài khoản
          </a>
          
          <p>Mã OTP này sẽ hết hạn sau <b>5 phút</b>.</p>

          <p>Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p>

          <hr style="margin:30px 0">

          <p style="font-size:12px; color:gray;">
            © ${new Date().getFullYear()} Hotel NBT. All rights reserved.
          </p>

        </div>
      </div>
    `,
    };

    await this.transporter.sendMail(otpMail);
  }
}
