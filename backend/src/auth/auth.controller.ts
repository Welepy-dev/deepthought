import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {

  constructor(
    private readonly authService: AuthService,
  ) {}

  @Get('42/login')
  @UseGuards(AuthGuard('42'))
  async login() {}

  @Get('42/callback')
  @UseGuards(AuthGuard('42'))
  async callback(@Req() req) {
    return this.authService.login42(
      req.user.accessToken,
    );
  }
}
