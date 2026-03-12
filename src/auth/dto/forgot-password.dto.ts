import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPassworDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
