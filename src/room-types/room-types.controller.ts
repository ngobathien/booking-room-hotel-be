import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RoomTypesService } from './room-types.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';

@Controller('room-types')
export class RoomTypesController {
  constructor(private readonly roomTypesService: RoomTypesService) {}

  @Post()
  createRoomType(@Body() createRoomTypeDto: CreateRoomTypeDto) {
    return this.roomTypesService.createRoomType(createRoomTypeDto);
  }

  @Get()
  findAllRoomTypes() {
    return this.roomTypesService.findAllRoomTypes();
  }

  @Get(':id')
  findRoomTypeById(@Param('id') id: string) {
    return this.roomTypesService.findRoomTypeById(id);
  }

  @Patch(':id')
  updateRoomType(
    @Param('id') id: string,
    @Body() updateRoomTypeDto: UpdateRoomTypeDto,
  ) {
    return this.roomTypesService.updateRoomType(id, updateRoomTypeDto);
  }

  @Delete(':id')
  removeRoomType(@Param('id') id: string) {
    return this.roomTypesService.removeRoomType(id);
  }
}
