import {
  Injectable,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async login42(accessToken: string) {
    const response = await fetch('https://api.intra.42.fr/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const profile = await response.json();

    let user = await this.usersService.findBy42Id(profile.id);

    if (!user) {
      user = await this.usersService.createFrom42(profile);
    }

    const jwt = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
    });

    return {
      access_token: jwt,
      user,
    };
  }
}