// reset-password.dto.ts
import { IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  resetToken: string;

  @MinLength(6)
  newPassword: string;
}
