// bookings/schemas/booking.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum BookingStayStatus {
  NOT_CHECKED_IN = 'not_checked_in',
  CHECKED_IN = 'checked-in',
  CHECKED_OUT = 'checked-out',
}

@Schema({ timestamps: true })
export class Booking {
  @Prop({ unique: true })
  bookingCode: string;

  @Prop({ type: Types.ObjectId, ref: 'Room', required: true })
  room: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;
  // snapshot
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: false })
  phone: string;

  @Prop({ required: true })
  checkInDate: Date;

  @Prop({ required: true })
  checkOutDate: Date;

  @Prop({ required: true })
  totalPrice: number;

  @Prop({ enum: BookingStatus, default: BookingStatus.PENDING })
  bookingStatus: BookingStatus;

  @Prop({ enum: BookingStayStatus, default: BookingStayStatus.NOT_CHECKED_IN })
  stayStatus: BookingStayStatus;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
