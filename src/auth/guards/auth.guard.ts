import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { UserRole } from '@/users/schemas/user.schema';
import { UsersService } from '@/users/users.service';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; role: UserRole };
}
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = this.extractTokenFromHeader(request);
    // console.log('request: ', request);

    console.log('token: ', token);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      // 💡 Here the JWT secret key that's used for verifying the payload
      // is the key that was passsed in the JwtModule
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);
      console.log('payload decode: ', payload);

      // tìm dữ liệu nhờ vào sub: _id từ payload decode từ token mà tìm dữ liệu
      const infoUser = await this.usersService.findByIdPublic(payload.sub);
      console.log('infoUser auth guard', infoUser);

      if (!infoUser) {
        throw new UnauthorizedException('User not found');
      }

      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      // request['infoUser'] = infoUser;
      request.user = {
        userId: payload.sub,
        role: infoUser.role,
      };
    } catch {
      throw new UnauthorizedException();
    }

    // request.user = user;
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }
}

// nhớ đọc review lại cho mà hiểu logic nhé
