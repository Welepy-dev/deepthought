import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp/otp.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { login42: jest.Mock; startEmailLogin: jest.Mock; loginWithEmail: jest.Mock; setPasswordWithOtp: jest.Mock };
  let otpService: { refreshTokens: jest.Mock };

  beforeEach(async () => {
    authService = {
      login42: jest.fn(),
      startEmailLogin: jest.fn(),
      loginWithEmail: jest.fn(),
      setPasswordWithOtp: jest.fn(),
    };

    otpService = {
      refreshTokens: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          /** Mock mínimo porque este spec só verifica se o controller compila. */
          provide: AuthService,
          /** O mock cobre os handlers 42 e email sem tocar no serviço real. */
          useValue: authService,
        },
        {
          /** Mock do serviço OTP/JWT reutilizado pelo endpoint POST /auth/refresh. */
          provide: OtpService,
          /** Evita assinar JWT real no teste estrutural do controller. */
          useValue: otpService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate email start/login/password routes to the auth service', async () => {
    authService.startEmailLogin.mockResolvedValue({ status: 'password' });
    authService.loginWithEmail.mockResolvedValue({
      success: true,
      accessToken: 'access',
      refreshToken: 'refresh',
      access_token: 'access',
      user: {
        id: 'user-1',
        login: 'marcsilv',
        displayName: 'marcsilv',
        avatar: null,
        campus: null,
        coalition: null,
        level: 1,
        role: 'USER',
        characterCreated: false,
      },
    });
    authService.setPasswordWithOtp.mockResolvedValue({
      success: true,
      accessToken: 'access',
      refreshToken: 'refresh',
      access_token: 'access',
      user: {
        id: 'user-1',
        login: 'marcsilv',
        displayName: 'marcsilv',
        avatar: null,
        campus: null,
        coalition: null,
        level: 1,
        role: 'USER',
        characterCreated: false,
      },
    });

    await expect(controller.startEmailLogin({ email: 'marcsilv@student.42luanda.com' } as any)).resolves.toEqual({
      status: 'password',
    });
    await expect(controller.loginWithEmail({ email: 'marcsilv@student.42luanda.com', password: 'secret123' } as any)).resolves.toMatchObject({
      success: true,
    });
    await expect(controller.setPasswordWithOtp({ userId: 'user-1', code: '123456', password: 'secret123' } as any)).resolves.toMatchObject({
      success: true,
    });

    expect(authService.startEmailLogin).toHaveBeenCalledWith('marcsilv@student.42luanda.com');
    expect(authService.loginWithEmail).toHaveBeenCalledWith('marcsilv@student.42luanda.com', 'secret123');
    expect(authService.setPasswordWithOtp).toHaveBeenCalledWith('user-1', '123456', 'secret123');
  });
});
