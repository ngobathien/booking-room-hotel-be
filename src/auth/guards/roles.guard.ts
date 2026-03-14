import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

import { Request } from 'express';
import { UserRole } from '../../users/schemas/user.schema';
// import { UserRole } from '../../users/schemas/user.schema';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    console.log('requiredRoles:', requiredRoles);

    if (!requiredRoles) {
      return true;
    }
    const { user } = context
      .switchToHttp()
      .getRequest<Request & { user: { role: UserRole } }>();
    console.log('user guard:', user);
    console.log('user role guard:', user.role);
    return requiredRoles.includes(user.role);
  }
}

// nhớ đọc review lại cho mà hiểu logic nhé
