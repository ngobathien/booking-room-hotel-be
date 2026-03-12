import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './dto/sign-in-auth.dto';
import { SignUpDto } from './dto/sign-up-auth.dto';

import * as bcrypt from 'bcrypt';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { User, UserDocument, UserStatus } from '../users/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RefreshToken } from './schemas/refresh-token.schema';
import { randomUUID } from 'crypto';
import { ResetToken } from './schemas/reset-token.schema';
import { MailService } from '../services/mail.service';
import { Otp, OtpDocument } from './schemas/email-otp.schema';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    // thêm UsersService từ user service
    private usersService: UsersService,
    //
    private jwtService: JwtService,

    // thêm MailService
    private mailService: MailService,

    // thêm model User
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    @InjectModel(Otp.name)
    private otpModel: Model<OtpDocument>,

    // thêm model RefreshToken
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshToken>,

    // thêm model ResetToken
    @InjectModel(ResetToken.name)
    private resetTokenModel: Model<ResetToken>,
  ) {}

  // ============================= đăng nhập =============================
  // signInDto: CreateAuthDto là để check dữ liệu từ client gửi lên có hợp lệ dữ liệu không
  async signIn(signInDto: SignInDto) {
    console.log('signInDto:', signInDto);

    // nhận email và password từ client gửi lên thông qua signInDto
    const { email, password } = signInDto;

    // kiểm tra email có tồn tại không, dùng email để tìm user
    const user = await this.usersService.findByEmail(email);
    // console.log(user?.email);

    // nếu không có user hoặc mật khẩu không đúng thì báo lỗi
    if (!user) {
      throw new UnauthorizedException('Email không đúng hoặc không tồn tại');
    }
    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }
    if (!user.isVerified) {
      throw new UnauthorizedException('Email chưa được xác thực');
    }

    /* so sánh password từ client gửi lên với password của hệ thống lưu ở database 
     thông qua user được tìm thấy */
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu không đúng');
    }

    // payload này dùng để mã hóa trong JWT
    const payload = {
      sub: user._id.toString(), // dùng để tìm dữ liệu khi decode payload dựa vào cái _id này
      // email: user.email,
      // role: user.role,
    };
    // console.log("payload  ",payload);

    // ====================== access_token ======================
    const access_token = await this.jwtService.signAsync(payload);
    // console.log('access_token: ', access_token);

    // ====================== refreshToken ======================
    const refreshToken = randomUUID();
    // console.log('refreshToken:', refreshToken);

    console.log('user._id', user._id);
    // Chỉ xoá những document “có chứa userId = user._id, không phải xóa user có _id đó nghe
    // XOÁ TOÀN BỘ refresh token cũ của user
    await this.refreshTokenModel.deleteMany({
      userId: user._id,
    });

    // ====================== tạo refreshToken mới lưu vào database ======================
    await this.refreshTokenModel.create({
      userId: user._id,
      token: refreshToken,
      // thời gian hết hạn của refresh token
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // nếu đúng thì trả về thông tin user
    return {
      message: 'Đăng nhập thành công',
      access_token,
      refreshToken,
      user: {
        role: user.role,
      },
    };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  //  ============================= đăng ký =============================
  async signUp(signUpDto: SignUpDto) {
    console.log('signUpDto:', signUpDto);

    const { email, password } = signUpDto;

    const existedUser = await this.usersService.findByEmail(email);

    if (existedUser) {
      throw new BadRequestException('Email của bạn đã tồn tại');
    }

    // =============================bcrypt mật khẩu==================================
    const saltOrRounds = 10;
    // cho password vào hàm bcryp.hash để mã hóa
    // salt là chuỗi ngẫu nhiên được thêm vào trước khi mã hóa để tăng cường bảo mật
    const hashedPassword = await bcrypt.hash(password, saltOrRounds);
    // console.log(`Hash: ${hashedPassword}`);

    const user = await this.userModel.create({
      ...signUpDto,
      password: hashedPassword,
      isVerified: false,
    });

    // tạo mã OTP
    const otp = this.generateOtp();

    // hash mã OTP
    const hashedOtp = await bcrypt.hash(otp, 10);

    // tạo thời gian hết hạn của otp
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // tạo để lưu vào db
    await this.otpModel.create({
      email,
      otp: hashedOtp,
      expiresAt,
    });

    // gửi mã otp về mail
    await this.mailService.sendOtpEmail(email, otp);

    return { message: 'OTP đã gửi tới email', email: user.email };
  }

  // ============================= verify OTP  =============================
  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    // nhận email và otp từ client
    const { email, otp } = verifyOtpDto;

    // tìm và xóa toàn bộ OTP của email đó
    const record = await this.otpModel
      .findOne({ email })
      .sort({ createdAt: -1 });

    if (!record) {
      throw new BadRequestException('OTP không hợp lệ hoặc đã hết hạn');
    }

    // mã hóa otp từ db
    const isOtpValid = await bcrypt.compare(otp, record.otp);

    if (!isOtpValid) {
      throw new BadRequestException('OTP không đúng');
    }

    // check OTP hết hạn
    if (record.expiresAt < new Date()) {
      throw new BadRequestException('OTP đã hết hạn');
    }

    await this.userModel.updateOne({ email }, { isVerified: true });

    await this.otpModel.deleteMany({ email });

    return {
      message: 'Xác thực email thành công',
    };
  }

  // ============================= resendOTP =============================
  async resendOtp(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email đã được xác thực');
    }

    // xoá OTP cũ
    await this.otpModel.deleteMany({ email });

    // tạo OTP mới
    const otp = this.generateOtp();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    const hashedOtp = await bcrypt.hash(otp, 10);

    await this.otpModel.create({
      email,
      otp: hashedOtp,
      expiresAt,
    });
    await this.mailService.sendOtpEmail(email, otp);

    return {
      message: 'OTP mới đã được gửi',
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    // Nhận refresh token từ client
    const { token } = refreshTokenDto;

    // tìm refresh token trong database
    const stored = await this.refreshTokenModel.findOne({
      // tìm mã token hiện tại, là một chuỗi chẳng hạn kèm với thời gian hết hạn của refresh token đó
      token,
      expiresAt: { $gt: new Date() },
    });
    console.log('stored: ', stored?._id);

    if (!stored) throw new UnauthorizedException();

    const user = await this.userModel.findById(stored.userId);

    const payload = {
      sub: user?._id.toString(),
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  // đăng xuất
  // async signOut() {
  //   // logic đăng xuất (nếu cần thiết, ví dụ: thu hồi token)
  //   return { message: 'Đăng xuất thành công' };
  // }

  //  ============================= đổi mật khẩu  =============================
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    // nhận email và password từ client gửi lên thông qua signInDto

    // kiểm tra email có tồn tại không, dùng email để tìm user
    const user = await this.usersService.findByIdWithPassword(userId);

    if (!user) throw new NotFoundException('User not found...');

    // so sánh mật khẩu cũ với mật khẩu trong database
    const comparePassword = await bcrypt.compare(oldPassword, user.password);

    if (!comparePassword) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }
    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      throw new BadRequestException(
        'Mật khẩu mới không được trùng mật khẩu cũ',
      );
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu phải ít nhất 6 ký tự');
    }

    // thay đổi mật khẩu
    const newHashedPassWord = await bcrypt.hash(newPassword, 10);

    user.password = newHashedPassWord;

    await user.save();

    return { message: 'Đổi mật khẩu thành công' };
  }
  // xác thực email

  // ============================= quên mật khẩu =============================
  async forgotPassword(email: string) {
    // check email này có tồn tại hay chưa
    const userExisting = await this.usersService.findByEmail(email);

    // nếu email tồn tại tạo token, thời gian hết hạn token
    if (userExisting) {
      // tạo token, mã sẽ random
      const resetToken = randomUUID();

      // thời gian hết hạn của reset token
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await this.resetTokenModel.create({
        resetPasswordToken: resetToken,
        userId: userExisting._id,
        resetPasswordExpires: expiresAt,
      });

      // gủi cho email này một link chứa token, gọi từ dịch vụ mail
      await this.mailService.sendPasswordResetEmail(email, resetToken);

      return {
        message: 'Nếu email hợp lệ, link đặt lại mật khẩu đã được gửi.',
      };
    }
  }

  // ============================= reset mật khẩu =============================
  async resetPassword(resetToken: string, newPassword: string) {
    if (newPassword.length < 6) {
      throw new BadRequestException('Password too short');
    }

    //  tìm giá trị reset token document trong database
    const token = await this.resetTokenModel.findOneAndDelete({
      resetPasswordToken: resetToken,
      // Kiểm tra token còn hiệu lực:
      // expiresAt phải lớn hơn hoặc bằng thời điểm hiện tại
      resetPasswordExpires: { $gte: new Date() },
    });

    console.log(token);

    if (!token) {
      throw new UnauthorizedException('Invalid link');
    }

    // thay đổi bằng mật khẩu mới
    // const user = await this.userModel.findById(token?.userId);

    // dùng qua usersService
    const user = await this.usersService.findByIdWithPassword(token.userId);
    console.log(user);
    if (!user) {
      throw new InternalServerErrorException();
    }

    // hash, mã hóa mật khẩu mới để lưu vào database
    user.password = await bcrypt.hash(newPassword, 10);

    // lưu mật khẩu mới vào document

    await user.save();

    return {
      message: 'Đặt lại mật khẩu thành công',
    };
  }
}
