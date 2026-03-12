// import { BadRequestException, Injectable } from '@nestjs/common';
// import { SupabaseService } from '@/config/supabase.config';
// import { Types } from 'mongoose';
// import { sanitizeFileName } from '@/common/utils/sanitizeFileName.utils';

// @Injectable()
// export class StorageService {
//   private bucketName = process.env.BUCKET_NAME!;
//   private supabase = this.supabaseService.client;
//   constructor(private readonly supabaseService: SupabaseService) {}

//   async uploadRoomImages(params: {
//     files: Express.Multer.File[];
//     type?: 'gallery' | 'thumbnail';
//   }): Promise<string[]> {
//     const { files, hotelId, type = 'gallery' } = params;

//     const roomId = params.roomId ?? new Types.ObjectId().toString();
//     const urls: string[] = [];

//     for (const file of files) {
//       const safeName = sanitizeFileName(file.originalname);

//       const path = `rooms/${createRoomDto.roomNumber}/${type}/${Date.now()}-${safeName}`;

//       const { error } = await supabase.storage
//         .from(this.bucketName)
//         .upload(path, file.buffer, {
//           contentType: file.mimetype,
//         });

//       if (error) {
//         throw new BadRequestException(error.message);
//       }

//       const { data } = this.supabaseService.supabase.storage
//         .from(this.bucketName)
//         .getPublicUrl(path);

//       urls.push(data.publicUrl);
//     }

//     return urls;
//   }

//   async removeFolder(bucket: string, folderPath: string) {
//     const supabase = this.supabaseService.client;

//     const { data: files, error } = await supabase.storage
//       .from(bucket)
//       .list(folderPath);

//     if (error) {
//       throw new BadRequestException('Không thể đọc thư mục ảnh');
//     }

//     if (!files || files.length === 0) return;

//     const paths = files.map((file) => `${folderPath}/${file.name}`);

//     const { error: removeError } = await supabase.storage
//       .from(bucket)
//       .remove(paths);

//     if (removeError) {
//       throw new BadRequestException('Xóa ảnh thất bại');
//     }
//   }
// }
