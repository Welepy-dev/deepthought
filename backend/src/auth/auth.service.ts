import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { SyncService } from '../sync/sync.service';
import { FortyTwoService } from '../integrations/fortytwo/fortytwo.service';
import { OtpService, OtpTokens } from './otp/otp.service';

export interface RequiresOtpResponse {
  requiresOtp: true;
  userId: string;
}

export interface AuthTokensResponse extends OtpTokens {
  access_token: string;
  user: {
    id: string;
    login: string;
    displayName: string;
    avatar: string | null;
    campus: string | null;
    coalition: string | null;
    level: number;
    role: string;
  };
}

export type Login42Response = RequiresOtpResponse | AuthTokensResponse;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly syncService: SyncService,
    private readonly fortyTwoService: FortyTwoService,
    private readonly otpService: OtpService,
  ) {}

  async login42(accessToken: string): Promise<Login42Response> {
    this.logger.log('Processing 42 OAuth login');

    const profile = await this.fortyTwoService.getMe(accessToken);

    let user = await this.usersService.findBy42Id(profile.fortyTwoId);

    if (!user) {
      this.logger.log(`Creating new user for login: ${profile.login}`);
      user = await this.usersService.createFrom42Profile(profile);
    } else {
      this.logger.log(`Existing user logged in: ${profile.login}`);
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { lastSeenAt: new Date() },
      });
    }

    await this.syncService.syncFromProfile(user.id, profile);

    user = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });

    if (user.isEmailVerified === false) {
      await this.otpService.generateAndSendOtp(user);

      return {
        requiresOtp: true,
        userId: user.id,
      };
    }

    const tokens = await this.otpService.issueTokens(user, accessToken);

    return {
      success: tokens.success,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      access_token: tokens.accessToken,
      user: {
        id: user.id,
        login: user.login,
        displayName: user.displayName,
        avatar: user.avatar,
        campus: user.campus,
        coalition: user.coalition,
        level: user.level,
        role: user.role,
      },
    };
  }
}
