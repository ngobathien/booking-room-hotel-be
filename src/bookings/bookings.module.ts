import { forwardRef, Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomTypesModule } from '../room-types/room-types.module';
import { UsersModule } from '../users/users.module';
import { RoomsModule } from '../rooms/rooms.module';
import { Booking, BookingSchema } from './schemas/booking.schema';
import {
  RoomType,
  RoomTypeSchema,
} from '../room-types/schemas/room-type.schema';
import { Room, RoomSchema } from '../rooms/schemas/room.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    RoomTypesModule,
    UsersModule,
    forwardRef(() => RoomsModule),

    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: RoomType.name, schema: RoomTypeSchema },
      { name: Room.name, schema: RoomSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
