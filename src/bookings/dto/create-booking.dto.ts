import { IsDateString, IsEmail, IsMongoId, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsMongoId()
  room: string;

  @IsDateString()
  checkInDate: string;

  @IsDateString()
  checkOutDate: string;

  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  phone_number: string;
}
