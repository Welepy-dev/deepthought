import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { SyncService } from '../sync/sync.service';
import { FortyTwoService } from '../integrations/fortytwo/fortytwo.service';
import { MappedFortyTwoProfile } from '../integrations/fortytwo/fortytwo.interfaces';
import { OtpService, OtpTokens } from './otp/otp.service';

export interface RequiresOtpResponse {
  requiresOtp: true;
  userId: string;
}

export interface AuthTokensResponse extends OtpTokens {
  /** Alias temporário para manter compatibilidade com o cookie antigo. */
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
    characterCreated: boolean;
  };
}

export type Login42Response = RequiresOtpResponse | AuthTokensResponse;

/** Resposta de POST /auth/email/start — diz ao frontend qual o próximo passo. */
export interface EmailStartResponse {
  /** 'setup' = primeiro login por email (OTP enviado); 'password' = pedir password. */
  status: 'setup' | 'password';
  /** Presente apenas no fluxo de setup, para POST /auth/email/set-password. */
  userId?: string;
}

/** Custo do bcrypt para hashing de passwords. */
const BCRYPT_COST = 10;

/**
 * Fluxo de login:
 * 1. Recebe o accessToken OAuth2 da callback da 42
 * 2. Busca o perfil do utilizador na API 42
 * 3. Cria o utilizador se for o primeiro login
 * 4. Se isEmailVerified=false, envia OTP e não gera JWT
 * 5. Se isEmailVerified=true, gera JWT imediatamente
 * 6. Inicia sync assíncrono para actualizar dados
 */
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

    if (!this.isEligible(profile)) {
      throw new ForbiddenException('not_eligible');
    }

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

    // O JWT só é emitido depois de User/Projects ficarem consistentes no Prisma.
    await this.syncService.syncFromProfile(user.id, profile);

    user = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });

    // Primeiro login: não emitimos JWT antes da validação OTP.
    if (user.isEmailVerified === false) {
      await this.otpService.generateAndSendOtp(user);

      return {
        requiresOtp: true,
        userId: user.id,
      };
    }

    // O accessToken OAuth2 é incluído no JWT para permitir sync manual com a 42.
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
        characterCreated: user.characterCreated,
      },
    };
  }

  /**
   * Primeiro passo do login por email: decide o fluxo a partir do estado da conta.
   *
   * - Email inexistente → 404 (só contas 42 já registadas podem entrar por email).
   * - Sem password definida → devolve status='setup' para onboarding imediato.
   * - Password definida → status='password' (frontend pede a password).
   */
  async startEmailLogin(email: string): Promise<EmailStartResponse> {
    const user = await this.findUserByEmail(email);

    if (!user) {
      throw new NotFoundException('This email is not registered');
    }

    if (user.isBanned) {
      throw new ForbiddenException('This account is banned');
    }

    if (!user.passwordHash) {
      return { status: 'setup', userId: user.id };
    }

    return { status: 'password' };
  }

  /**
   * Onboarding do primeiro login por email: define a password e emite tokens.
   * Não depende de OTP porque a criação da password já serve como onboarding.
   */
  async setPasswordWithOtp(
    userId: string,
    code: string,
    password: string,
  ): Promise<AuthTokensResponse> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isEmailVerified: true,
        otpCode: null,
        otpExpiresAt: null,
        lastSeenAt: new Date(),
      },
    });

    return this.buildTokensResponse(updated);
  }

  /** Login por email para contas que já definiram password. */
  async loginWithEmail(
    email: string,
    password: string,
  ): Promise<AuthTokensResponse> {
    const user = await this.findUserByEmail(email);

    if (!user) {
      throw new NotFoundException('This email is not registered');
    }

    if (user.isBanned) {
      throw new ForbiddenException('This account is banned');
    }

    if (!user.passwordHash) {
      // Conta ainda sem password: o frontend deve refazer /auth/email/start.
      throw new UnauthorizedException('Password not set for this account');
    }

    const matches = await bcrypt.compare(password, user.passwordHash);

    if (!matches) {
      throw new UnauthorizedException('Invalid password');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });

    return this.buildTokensResponse(updated);
  }

  /** Procura por email sem sensibilidade a maiúsculas (42 guarda emails variados). */
  private findUserByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      return Promise.resolve(null);
    }

    return this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });
  }

  /** Monta a resposta de tokens+perfil usada pelos fluxos de email. */
  private async buildTokensResponse(user: User): Promise<AuthTokensResponse> {
    const tokens = await this.otpService.issueTokens(user);

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
        characterCreated: user.characterCreated,
      },
    };
  }

  private isEligible(profile: MappedFortyTwoProfile): boolean {
    const kind = profile.kind?.toLowerCase() ?? '';
    if (kind === 'staff' || kind === 'admin') return true;
    return profile.cursusUsers.some((cu) => cu.slug === '42cursus' && cu.end_at === null);
  }
}
