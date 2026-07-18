import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { FortyTwoService } from '../integrations/fortytwo/fortytwo.service';
import { PrismaService } from '../prisma/prisma.service';
import { SyncService } from '../sync/sync.service';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp/otp.service';

describe('AuthService', () => {
  let service: AuthService;
  let otpService: { generateAndSendOtp: jest.Mock; issueTokens: jest.Mock };
  let prismaService: { user: { findFirst: jest.Mock; update: jest.Mock } };

  beforeEach(async () => {
    otpService = {
      generateAndSendOtp: jest.fn(),
      issueTokens: jest.fn(),
    };

    prismaService = {
      user: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          /** Mock do Prisma para evitar conexão real à BD no smoke test. */
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          /** Mock do UsersService usado pelo AuthService via DI. */
          provide: UsersService,
          useValue: { findBy42Id: jest.fn(), createFrom42Profile: jest.fn() },
        },
        {
          /** Mock do SyncService para não executar sync assíncrono real no teste. */
          provide: SyncService,
          useValue: { syncFromProfile: jest.fn(), syncUser: jest.fn() },
        },
        {
          /** Mock da integração 42 para não fazer requests externos. */
          provide: FortyTwoService,
          useValue: { getMe: jest.fn() },
        },
        {
          /** Mock do OTP para satisfazer o primeiro-login flow. */
          provide: OtpService,
          useValue: otpService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should not send an OTP for first-time email login onboarding', async () => {
    prismaService.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'student@42.fr',
      passwordHash: null,
      isBanned: false,
      isEmailVerified: false,
    });

    const result = await service.startEmailLogin('student@42.fr');

    expect(result).toEqual({ status: 'setup', userId: 'user-1' });
    expect(otpService.generateAndSendOtp).not.toHaveBeenCalled();
  });

  it('should trim whitespace before looking up an email', async () => {
    prismaService.user.findFirst.mockResolvedValue({
      id: 'user-2',
      email: 'student@42.fr',
      passwordHash: 'hash',
      isBanned: false,
      isEmailVerified: true,
    });

    await expect(service.startEmailLogin('  student@42.fr  ')).resolves.toEqual({
      status: 'password',
    });

    expect(prismaService.user.findFirst).toHaveBeenCalledWith({
      where: {
        email: { equals: 'student@42.fr', mode: 'insensitive' },
      },
    });
  });
});
