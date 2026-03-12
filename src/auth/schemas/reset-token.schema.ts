// backend/src/auth/schemas/refresh-token.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ versionKey: false, timestamps: true })
export class ResetToken {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  resetPasswordToken: string; // hash

  @Prop({ required: true })
  resetPasswordExpires: Date;
}

export const ResetTokenSchema = SchemaFactory.createForClass(ResetToken);
