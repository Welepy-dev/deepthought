import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
    
  async findBy42Id(fortyTwoId: number) {
    return this.prisma.user.findUnique({
      where: { fortyTwoId },
    });
  }

  async createFrom42(profile: any) {
    return this.prisma.user.create({
      data: {
        fortyTwoId: profile.id,
        login: profile.login,
        email: profile.email,
        displayName: profile.displayname,
        avatar: profile.image?.link,
        campus: profile.campus?.[0]?.name,
        coalition: profile.campus?.[0]?.coalition?.name,
      },
    });
  }
}
