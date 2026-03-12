import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Connection, Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';

import { AuthModule } from './auth/auth.module';
import { RoomsModule } from './rooms/rooms.module';
import { RoomTypesModule } from './room-types/room-types.module';

@Module({
  imports: [
    // env
    ConfigModule.forRoot({ isGlobal: true, load: [] }),

    // kết nối database mongodb
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),

        onConnectionCreate: (connection: Connection) => {
          connection.on('connected', () => {
            console.log('Kết nối database thành công');
          });

          // log xem MONGODB_URI từ .env
          console.log(configService.get<string>('MONGODB_URI'));
          return connection;
        },
      }),
    }),
    //
    UsersModule,
    AuthModule,
    RoomsModule,
    RoomTypesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
