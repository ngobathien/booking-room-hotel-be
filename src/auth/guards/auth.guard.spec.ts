import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';

describe('AuthGuard', () => {
  it('should be defined', () => {
    const jwtService = {} as JwtService;
    const usersService = {} as UsersService;

    expect(new AuthGuard(jwtService, usersService)).toBeDefined();
  });
});
