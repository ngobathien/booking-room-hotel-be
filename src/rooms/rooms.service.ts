import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Room, RoomDocument } from './schemas/room.schema';
import { isValidObjectId, Model, Types } from 'mongoose';
import { SupabaseService } from '@/config/supabase.config';
import { sanitizeFileName } from '@/common/utils/sanitizeFileName.utils';
import { Booking, BookingDocument } from '@/bookings/schemas/booking.schema';
import { SearchRoomDto } from './dto/search-room.dto';

@Injectable()
export class RoomsService {
  private readonly bucketName: string;
  constructor(
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    private readonly supabaseService: SupabaseService,

    //
    @InjectModel(Booking.name)
    private bookingModel: Model<BookingDocument>,
  ) {
    if (!process.env.BUCKET_NAME) {
      throw new Error('BUCKET_NAME is not defined');
    }

    this.bucketName = process.env.BUCKET_NAME;
  }

  /**
   * Tạo phòng mới + upload nhiều ảnh lên Supabase Storage
   * - Bắt buộc có ít nhất 1 ảnh
   * - Chỉ chấp nhận file image/*
   * - Upload ảnh lên bucket Supabase
   * - Lưu danh sách URL ảnh + thumbnail (ảnh đầu tiên) vào DB
   */
  async createNewRoomWithImages(
    createRoomDto: CreateRoomDto,
    files: Express.Multer.File[],
  ) {
    const supabase = this.supabaseService.client;
    const uploadedUrls: string[] = [];

    // 🔥 Nếu có upload file → upload lên Supabase
    if (files && files.length > 0) {
      for (const file of files) {
        if (!file.mimetype.startsWith('image/')) {
          throw new BadRequestException(
            `File ${file.originalname} không phải ảnh`,
          );
        }

        const safeName = sanitizeFileName(file.originalname);

        const path = `rooms/${createRoomDto.roomNumber}-room/${Date.now()}-${safeName}`;

        const { error } = await supabase.storage
          .from(this.bucketName)
          .upload(path, file.buffer, {
            contentType: file.mimetype,
          });

        if (error) {
          throw new BadRequestException(error.message ?? 'Upload ảnh thất bại');
        }

        const { data } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(path);

        uploadedUrls.push(data.publicUrl);
      }
    }

    // 🔥 Nếu KHÔNG có file nhưng có thumbnail (link)
    if ((!files || files.length === 0) && createRoomDto.thumbnail) {
      uploadedUrls.push(createRoomDto.thumbnail);
    }

    if (uploadedUrls.length === 0) {
      throw new BadRequestException('Phải có ít nhất 1 ảnh hoặc link ảnh');
    }

    return this.roomModel.create({
      ...createRoomDto,
      images: uploadedUrls,
      thumbnail: uploadedUrls[0],
    });
  }

  // search room theo ngày check-in, check-out và số lượng khách
  /*  Tìm booking trùng ngày
      Lấy id phòng đã bị book
      Loại chúng khỏi danh sách room
      Lọc theo capacity
      Trả về kết quả */
  async searchAvailableRooms(query: SearchRoomDto) {
    // nhận dữ liệu từ query params từ FE gửi lên, destructuring
    const { checkInDate, checkOutDate, guests } = query;

    // validate dữ liệu ngày tháng gửi lên
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkOut <= checkIn) {
      throw new BadRequestException('Ngày check-out phải sau ngày check-in');
    }

    // Tìm các room đã bị book trùng ngày
    const bookedRoomIds = await this.bookingModel
      .find({
        // Lấy các booking KHÔNG bị huỷ
        // $ne = not equal (không bằng)
        status: { $ne: 'cancelled' },

        // Điều kiện overlap (trùng ngày):
        // booking cũ có checkIn < ngày checkOut mới
        // $lt = less than (nhỏ hơn)
        checkInDate: { $lt: checkOut },

        // booking cũ có checkOut > ngày checkIn mới
        // $gt = greater (lớn hơn)
        checkOutDate: { $gt: checkIn },
      })
      // chỉ lấy danh sách roomId không trùng nhau
      .distinct('room');

    // console.log('Booked Room IDs:', bookedRoomIds);

    /*  ================================
    TÌM CÁC ROOM CHƯA BỊ BOOK
    ================================ */
    const availableRooms = await this.roomModel
      .find({
        /* $nin = not in (không nằm trong mảng)
        nghĩa là: lấy các room KHÔNG nằm trong danh sách đã bị book */
        _id: { $nin: bookedRoomIds },
      })
      .populate({
        path: 'roomType',
        // match = điều kiện lọc khi populate
        // capacity phải >= số khách user nhập
        // $gte = greater than or equal (>=)
        match: { capacity: { $gte: Number(guests) } },
      });

    /*   ================================
    LOẠI ROOM KHÔNG ĐỦ SỨC CHỨA
    ================================
 */
    // Nếu roomType không đủ capacity
    // thì populate sẽ trả về roomType = null
    // nên ta phải filter lại
    const filteredRooms = availableRooms.filter(
      (room) => room.roomType !== null,
    );

    return {
      // tổng số phòng còn trống và đủ sức chứa
      total: filteredRooms.length,

      // danh sách phòng
      rooms: filteredRooms,
    };
  }

  // tìm all dữ liệu phòng
  async findAllRooms(query: any) {
    const {
      keyword,
      status,
      roomType,
      capacity,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sort,
    } = query;

    const filter: any = {};

    /* ======================
     1️⃣ SEARCH
  ====================== */
    if (keyword) {
      filter.roomNumber = { $regex: keyword, $options: 'i' };
    }

    /* ======================
     2️⃣ FILTER
  ====================== */

    if (status) {
      filter.status = status;
    }

    if (roomType) {
      if (!isValidObjectId(roomType)) {
        throw new BadRequestException('Room type id không hợp lệ');
      }
      filter.roomType = roomType;
    }

    /* ======================
     3️⃣ QUERY BUILDER
  ====================== */

    let queryBuilder = this.roomModel.find(filter).populate({
      path: 'roomType',
      match: {
        ...(capacity && { capacity: Number(capacity) }),
        ...(minPrice && { pricePerNight: { $gte: Number(minPrice) } }),
        ...(maxPrice && { pricePerNight: { $lte: Number(maxPrice) } }),
      },
    });

    /* ======================
     4️⃣ SORT
  ====================== */

    if (sort) {
      switch (sort) {
        case 'price_asc':
          queryBuilder = queryBuilder.sort({ 'roomType.pricePerNight': 1 });
          break;

        case 'price_desc':
          queryBuilder = queryBuilder.sort({ 'roomType.pricePerNight': -1 });
          break;
      }
    }

    /* ======================
     5️⃣ PAGINATION
  ====================== */

    const skip = (Number(page) - 1) * Number(limit);

    queryBuilder = queryBuilder.skip(skip).limit(Number(limit));

    const rooms = await queryBuilder.exec();

    // Loại những room bị null do match populate
    const filteredRooms = rooms.filter((room) => room.roomType !== null);

    const total = await this.roomModel.countDocuments(filter);

    return {
      total,
      page: Number(page),
      limit: Number(limit),
      data: filteredRooms,
    };
  }

  // new thử nghiệm tìm all dữ liệu phòng

  // tìm dữ liệu phòng theo một _id cụ thể
  async findRoomById(roomId: string): Promise<RoomDocument> {
    // check sai _id gửi lên
    if (!isValidObjectId(roomId)) {
      throw new BadRequestException('Room id không hợp lệ');
    }
    const roomData = await this.roomModel.findById(roomId).populate('roomType');

    // check dữ liệu room có hay không
    if (!roomData) {
      throw new NotFoundException('Không tìm thấy dữ liệu phòng');
    }
    return roomData;
  }

  //
  async updateRoomWithImages(
    roomId: string,
    updateRoomDto: UpdateRoomDto,
    files?: Express.Multer.File[],
  ) {
    if (!isValidObjectId(roomId)) {
      throw new BadRequestException('Room id không hợp lệ');
    }

    const room = await this.roomModel.findById(roomId);

    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }

    const supabase = this.supabaseService.client;
    const newUploadedUrls: string[] = [];

    /* ==============================
     1️⃣ Upload ảnh mới nếu có
  ============================== */

    if (files && files.length > 0) {
      for (const file of files) {
        if (!file.mimetype.startsWith('image/')) {
          throw new BadRequestException(
            `File ${file.originalname} không phải ảnh`,
          );
        }

        const safeName = sanitizeFileName(file.originalname);

        const path = `rooms/${room.roomNumber}-room/${Date.now()}-${safeName}`;

        const { error } = await supabase.storage
          .from(this.bucketName)
          .upload(path, file.buffer, {
            contentType: file.mimetype,
          });

        if (error) {
          throw new BadRequestException(error.message);
        }

        const { data } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(path);

        newUploadedUrls.push(data.publicUrl);
      }
    }

    /* ==============================
     2️⃣ Merge ảnh cũ + ảnh mới
  ============================== */

    const finalImages = [
      ...(updateRoomDto.images ?? []), // ảnh cũ còn lại
      ...newUploadedUrls, // ảnh mới
    ];

    if (finalImages.length === 0) {
      throw new BadRequestException('Phải có ít nhất 1 ảnh');
    }

    /* ==============================
     3️⃣ Update dữ liệu
  ============================== */

    room.roomNumber = updateRoomDto.roomNumber ?? room.roomNumber;
    room.status = updateRoomDto.status ?? room.status;
    // room.roomType = updateRoomDto.roomType ?? room.roomType;
    if (updateRoomDto.roomType) {
      if (!isValidObjectId(updateRoomDto.roomType)) {
        throw new BadRequestException('roomType không hợp lệ');
      }

      room.roomType = new Types.ObjectId(updateRoomDto.roomType);
    }
    room.description = updateRoomDto.description ?? room.description;

    room.images = finalImages;

    // nếu FE không chọn thumbnail → lấy ảnh đầu
    room.thumbnail = updateRoomDto.thumbnail ?? finalImages[0];

    await room.save();

    return room;
  }

  // xóa 1 phòng theo id
  async removeRoomById(roomId: string): Promise<{ message: string }> {
    if (!isValidObjectId(roomId)) {
      throw new BadRequestException('Room id không hợp lệ');
    }
    const roomData = await this.roomModel.findByIdAndDelete(roomId);

    if (!roomData) {
      throw new NotFoundException('Không tìm thấy dữ liệu phòng để xóa');
    }
    return {
      message: 'Xóa phòng thành công',
    };
  }

  // xóa tất cả phòng được chọn
  // removeAllRooms(id: number) {
  //   return this.roomModel.findByIdAndDelete(id);
  // }
}
