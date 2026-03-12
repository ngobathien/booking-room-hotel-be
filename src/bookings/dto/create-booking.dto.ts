import { IsDateString, IsMongoId } from 'class-validator';

export class CreateBookingDto {
  @IsMongoId()
  room: string;

  @IsDateString()
  checkInDate: string;

  @IsDateString()
  checkOutDate: string;
}
