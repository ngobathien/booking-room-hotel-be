import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateRoomTypeDto {
  @IsString()
  @IsNotEmpty()
  typeName: string; // tên loại phòng

  @IsInt()
  @Min(1)
  capacity: number; // số người tối đa

  @IsNumber()
  @Min(0)
  pricePerNight: number; // giá cơ bản / đêm
}
