import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ArrayMaxSize,
} from 'class-validator';
import { RoomStatus } from '../enums/room-status.enum';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  images?: string[];

  @IsMongoId()
  // @IsNotEmpty()
  hotelId: string;

  @IsMongoId()
  // @IsNotEmpty()
  roomType: string;

  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @IsOptional()
  @IsString()
  description?: string;
}
