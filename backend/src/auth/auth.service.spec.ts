import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { FortyTwoService } from '../integrations/fortytwo/fortytwo.service';
import { PrismaService } from '../prisma/prisma.service';
import { SyncService } from '../sync/sync.service';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp/otp.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          /** Mock do Prisma para evitar conexão real à BD no smoke test. */
          provide: PrismaService,
          useValue: { user: { update: jest.fn() } },
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
          useValue: { generateAndSendOtp: jest.fn(), issueTokens: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
