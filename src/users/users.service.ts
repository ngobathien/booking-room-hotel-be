import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  // tạo user
  async create(dto: CreateUserDto): Promise<UserDocument> {
    return this.userModel.create(dto);
  }

  // admin lấy tất cả list user (KHÔNG trả password)
  async getAllUsers(): Promise<User[]> {
    return this.userModel
      .find()
      .select('-password')
      .sort({ createdAt: -1 })
      .exec();
  }

  // dùng cho AUTH (cần password)
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  // dùng cho profile / API public
  async findByIdPublic(id: string): Promise<User | null> {
    return this.userModel.findById(id).select('-password').exec();
  }

  // users.service.ts
  // cho việc đổi mật khẩu
  async findByIdWithPassword(
    id: string | Types.ObjectId,
  ): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(id, dto, { new: true })
      .select('-password')
      .exec();
  }

  async removeUser(id: string): Promise<User | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }
}
