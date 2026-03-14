import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SearchRoomDto } from './dto/search-room.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  // tạo room mới
  // admin mới được tạo
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @UseInterceptors(FilesInterceptor('files', 10))
  createNewRoomWithImages(
    @Body() createRoomDto: CreateRoomDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.roomsService.createNewRoomWithImages(createRoomDto, files);
  }

  // search room theo ngày check-in, check-out và số lượng khách
  @Get('search')
  async searchAvailableRooms(@Query() query: SearchRoomDto) {
    return this.roomsService.searchAvailableRooms(query);
  }

  // lấy tất cả danh sách room hiện có
  @Get()
  findAllRooms(
    // lọc phòng

    @Query('status') status?: string,
    @Query('capacity') capacity?: number,

    @Query('roomType') roomType?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,

    // phân trang
    @Query('page') page?: number,
    @Query('limit') limit?: number,

    //
    @Query('sort') sort?: string,
  ) {
    return this.roomsService.findAllRooms({
      status,
      capacity,

      roomType,

      minPrice,
      maxPrice,

      page,
      limit,
      sort,
    });
  }

  // tìm room theo id của riêng room đó từ database
  @Get(':roomId')
  findRoomById(@Param('roomId') roomId: string) {
    console.log(roomId);
    return this.roomsService.findRoomById(roomId);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files', 10))
  updateRoom(
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.roomsService.updateRoomWithImages(id, updateRoomDto, files);
  }

  // xóa 1 phòng theo id
  @Delete(':id')
  removeRoomsById(@Param('id') id: string) {
    return this.roomsService.removeRoomById(id);
  }

  // xóa tất cả phòng
  // @Delete(':id')
  // removeAllRooms(@Param('id') id: string) {
  //   return this.roomsService.removeAllRooms(+id);
  // }
}
