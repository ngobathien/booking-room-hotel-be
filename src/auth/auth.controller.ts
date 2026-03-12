import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Put,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in-auth.dto';
import { SignUpDto } from './dto/sign-up-auth.dto';
import { AuthGuard } from './guards/auth.guard';
import { UsersService } from '../users/users.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPassworDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
// import { CreateAuthDto } from './dto/create-auth.dto';
// import { UpdateAuthDto } from './dto/update-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  // đăng nhập
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  // đăng ký
  @Post('register')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  // xác định xem đã đăng nhập hay chưa, và là ai
  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@Request() req: Request & { user: { userId: string } }) {
    // const data = await this.usersService.findById(req.user.sub);
    // console.log('data từ database', data);
    // console.log('data từ database', req.infoUser);
    // return req.infoUser;

    console.log('data từ database', req.user.userId);
    return this.usersService.findByIdPublic(req.user.userId);
    // return this.usersService.findById(req.user.sub);
  }

  @Post('refresh-token')
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  @UseGuards(AuthGuard)
  @Put('change-password')
  changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req: Request & { user: { userId: string } },
  ) {
    const { oldPassword, newPassword } = changePasswordDto;
    return this.authService.changePassword(
      req.user.userId,
      oldPassword,
      newPassword,
    );
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPassworDto: ForgotPassworDto) {
    return this.authService.forgotPassword(forgotPassworDto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.resetToken,
      resetPasswordDto.newPassword,
    );
  }

  @Post('verify-otp')
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post('resend-otp')
  resendOtp(@Body('email') email: string) {
    return this.authService.resendOtp(email);
  }
}
