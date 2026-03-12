import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RoomTypeDocument = HydratedDocument<RoomType>;

@Schema({ timestamps: true })
export class RoomType {
  @Prop({ required: true, unique: true, trim: true })
  typeName: string;

  @Prop({ required: true, min: 1 })
  capacity: number;

  @Prop({ required: true, min: 0 })
  // basePrice: number;
  pricePerNight: number;
}

export const RoomTypeSchema = SchemaFactory.createForClass(RoomType);
