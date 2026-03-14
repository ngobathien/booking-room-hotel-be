import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AuthGuard } from '@/auth/guards/auth.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@/users/schemas/user.schema';
/* 
GET    /bookings/check-availability x
POST   /bookings x
GET    /bookings x 
GET    /bookings/my-bookings x
GET    /bookings/:id 
PATCH  /bookings/:id/cancel
PATCH  /bookings/:id/confirm
PATCH  /bookings/:id/check-in
PATCH  /bookings/:id/check-out */
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // Kiểm tra chi tiết một phòng có sẵn trong khoảng thời gian hay không
  @Get('check-availability')
  async checkRoomAvailability(
    @Query('roomId') roomId: string,
    @Query('checkInDate') checkInDate: string,
    @Query('checkOutDate') checkOutDate: string,
  ): Promise<{ available: boolean }> {
    return this.bookingsService.checkRoomAvailability(
      roomId,
      new Date(checkInDate),
      new Date(checkOutDate),
    );
  }

  // tạo booking mới
  @UseGuards(AuthGuard)
  @Post()
  createBooking(
    @Body() dto: CreateBookingDto,
    @Req() req: Request & { user: { userId: string } },
  ) {
    return this.bookingsService.createBooking(dto, req.user.userId);
  }

  // lấy danh sách tất cả booking
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.bookingsService.findAll();
  }

  // user xem lịch sử đặt phòng của mình
  @UseGuards(AuthGuard)
  @Get('me')
  async getMyBookings(@Req() req: Request & { user: { userId: string } }) {
    return this.bookingsService.getMyBookings(req.user.userId);
  }

  // lấy chi tiết một booking
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  // hủy booking
  @UseGuards(AuthGuard)
  @Patch(':id/cancel')
  cancelBooking(
    @Param('id') id: string,
    @Req() req: Request & { user: { userId: string } },
  ) {
    return this.bookingsService.cancelBooking(id, req.user.userId);
  }

  @Patch(':id/check-in')
  checkIn(@Param('id') id: string) {
    return this.bookingsService.checkInBooking(id);
  }

  @Patch(':id/check-out')
  checkOut(@Param('id') id: string) {
    return this.bookingsService.checkOutBooking(id);
  }
}
