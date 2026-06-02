import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { MailerModule } from '@nestjs-modules/mailer';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { PrismaModule } from '../prisma/prisma.module';

import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,

    PassportModule,

    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev_secret',
      signOptions: {
        expiresIn: '15m',
      },
    }),

    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
  ],

  exports: [AuthService],
})
export class AuthModule {}