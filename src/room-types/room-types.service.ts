import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { RoomType, RoomTypeDocument } from './schemas/room-type.schema';

@Injectable()
export class RoomTypesService {
  constructor(
    @InjectModel(RoomType.name) private roomTypeModel: Model<RoomTypeDocument>,
  ) {}

  // tạo loại phòng mới
  async createRoomType(
    createRoomTypeDto: CreateRoomTypeDto,
  ): Promise<RoomTypeDocument> {
    const roomTypeData = await this.roomTypeModel.create(createRoomTypeDto);
    return roomTypeData;
  }

  // tìm all loại phòng mới
  findAllRoomTypes() {
    return this.roomTypeModel.find();
  }

  // tìm loại phòng theo id
  async findRoomTypeById(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid roomType id');
    }
    const roomType = await this.roomTypeModel.findById(id);

    if (!roomType) {
      throw new NotFoundException('Room type not found');
    }

    return roomType;
  }

  // cập nhật dữ liệu loại phòng
  async updateRoomType(id: string, updateRoomTypeDto: UpdateRoomTypeDto) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid roomType id');
    }

    const updatedRoomType = await this.roomTypeModel.findByIdAndUpdate(
      id,
      updateRoomTypeDto,
      { new: true },
    );

    if (!updatedRoomType) {
      throw new NotFoundException('Room type not found');
    }

    return updatedRoomType;
  }

  // xóa loại phòng theo id
  async removeRoomType(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid roomType id');
    }
    const deletedRoomType = await this.roomTypeModel.findByIdAndDelete(id);

    if (!deletedRoomType) {
      throw new NotFoundException('Room type not found');
    }

    return { message: 'Xóa loại phòng thành công' };
  }
}
