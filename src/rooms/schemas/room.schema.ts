import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { RoomStatus } from '../enums/room-status.enum';
import { RoomType } from '../../room-types/schemas/room-type.schema';

export type RoomDocument = HydratedDocument<Room>;

@Schema({ timestamps: true })
export class Room {
  @Prop({ required: true, trim: true, unique: true })
  roomNumber: string;

  @Prop({ default: null })
  thumbnail?: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  // hotel_id  ref sang Hotel schema
  @Prop({
    type: Types.ObjectId,
    // ref: Hotel.name, // ✅ giống RoomType.name
    required: true,
  })
  hotelId: Types.ObjectId;
  // room_type_id  ref sang RoomType schema tham chiếu đến room_types
  @Prop({
    type: Types.ObjectId,
    ref: RoomType.name,
    required: true,
  })
  roomType: Types.ObjectId;

  @Prop({
    type: String,
    enum: RoomStatus,
    default: RoomStatus.AVAILABLE,
  })
  status: RoomStatus;

  @Prop({ default: '' })
  description?: string;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
