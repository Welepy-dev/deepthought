import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UseGuards, Get } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { VerifyOtpDto } from './dto/verify-otp.dto';

import { Request } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('refresh')
  refresh(@Body() body: { refreshToken: string }, @Request() req) {
    return this.authService.refresh(body.refreshToken)
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Request() req) {
    return this.authService.logout(req.user.userId)
  }
}
