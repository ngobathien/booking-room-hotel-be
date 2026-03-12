import { Module } from '@nestjs/common';
import { RoomTypesService } from './room-types.service';
import { RoomTypesController } from './room-types.controller';

import { RoomType, RoomTypeSchema } from './schemas/room-type.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RoomType.name, schema: RoomTypeSchema },
    ]),
  ],
  controllers: [RoomTypesController],
  providers: [RoomTypesService],

  exports: [RoomTypesService],
})
export class RoomTypesModule {}
