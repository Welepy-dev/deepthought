import {
  Injectable,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login42(accessToken: string) {

    const response = await fetch(
      'https://api.intra.42.fr/v2/me',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const profile = await response.json();

    let user = await this.prisma.user.findUnique({
      where: {
        fortyTwoId: profile.id,
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          fortyTwoId: profile.id,
          login: profile.login,
          email: profile.email,
          displayName: profile.displayname,
          avatar: profile.image.link,
        },
      });
    }

    const payload = {
      sub: user.id,
    };

    const access_token =
      await this.jwtService.signAsync(payload);

    return {
      access_token,
      user,
    };
  }
}
