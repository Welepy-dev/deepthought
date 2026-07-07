import {ExecutionContext, Injectable, UnauthorizedException,} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { JwtUser } from '../interfaces/jwt-user.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = JwtUser>(
    err: Error | null,
    user: JwtUser | false | null,
    info: Error | null,
    context: ExecutionContext,
    status?: unknown,
  ): TUser {
    void info;
    void context;
    void status;

    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or missing JWT token');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('User account is banned');
    }

    return user as TUser;
  }
}
