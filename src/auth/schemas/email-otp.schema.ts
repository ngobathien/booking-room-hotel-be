import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({ timestamps: true })
export class Otp {
  @Prop()
  email: string;

  @Prop()
  otp: string;

  // OTP hết hạn tự xóa
  @Prop({ expires: 300 }) // 300 = 300 giây = 5 phút
  expiresAt: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
