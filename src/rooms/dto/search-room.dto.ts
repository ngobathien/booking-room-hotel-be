import { Type } from 'class-transformer';
import { IsDateString, IsInt, Min } from 'class-validator';

export class SearchRoomDto {
  @IsDateString()
  checkInDate: string;

  @IsDateString()
  checkOutDate: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  guests: number;
}
