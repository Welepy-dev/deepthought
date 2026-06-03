import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailer: MailerService,
  ) {}

  async signup(dto: SignupDto) {
    const userExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (userExists) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
      },
    });

    return {
      message: 'User created',
      user: { id: user.id, email: user.email },
    };
  }

  async login(dto: LoginDto) {
    await this.createAndSendOtp(dto.email);
    return {
      message: 'OTP sent',
      requires2fa: true,
    };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    })
    return { message: 'Logged out successfully' }
  }

  private async createAndSendOtp(email: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.oTPCode.deleteMany({
      where: { email },
    });

    await this.prisma.oTPCode.create({
      data: {
        email,
        code: otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    await this.mailer.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Deepthought OTP',
      text: `Your OTP code is: ${otp}`,
    });
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const otpRecord = await this.prisma.oTPCode.findFirst({
      where: {
        email: dto.email,
        code: dto.otp,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid OTP');
    }

    await this.prisma.oTPCode.delete({
      where: {
        id: otpRecord.id,
      },
    });

    let user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: '',
        },
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = randomBytes(64).toString('hex');
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: refreshTokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    const storedTokens = await this.prisma.refreshToken.findMany({
      where: {
        revoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    })

    const storedToken = await this.findMatchingRefreshToken(refreshToken, storedTokens);

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    const newRefreshToken = randomBytes(64).toString('hex');
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: newRefreshTokenHash,
        userId: storedToken.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const payload = {
      sub: storedToken.userId,
      email: storedToken.user.email,
    }

    const newAccessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    })

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }
  }

  private async findMatchingRefreshToken(
    refreshToken: string,
    storedTokens: Array<{
      id: string;
      tokenHash: string;
      userId: string;
      user: { email: string };
    }>,
  ) {
    for (const storedToken of storedTokens) {
      if (await bcrypt.compare(refreshToken, storedToken.tokenHash)) {
        return storedToken;
      }
    }
    return null;
  }
}
