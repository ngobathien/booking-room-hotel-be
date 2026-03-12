import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { ConfigModule } from '@nestjs/config';
import { Room, RoomSchema } from './schemas/room.schema';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../auth/constants';
import { RoomTypesModule } from '../room-types/room-types.module';

import {
  RoomType,
  RoomTypeSchema,
} from '../room-types/schemas/room-type.schema';
import { SupabaseService } from '../config/supabase.config';
import { BookingsModule } from '../bookings/bookings.module';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';

@Module({
  imports: [
    RoomTypesModule,
    UsersModule,
    ConfigModule,
    BookingsModule,

    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      { name: RoomType.name, schema: RoomTypeSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),

    // để hờ xem có cần đến ko
    // JwtModule.register({
    //   global: true,
    //   secret: jwtConstants.secret,
    //   signOptions: { expiresIn: '1d' },
    // }),
  ],
  controllers: [RoomsController],
  providers: [RoomsService, SupabaseService],
})
export class RoomsModule {}
