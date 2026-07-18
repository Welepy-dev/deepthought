import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

/** DTO de POST /auth/email/start — só o email, para decidir o próximo passo. */
export class EmailStartDto {
  /** Email da conta 42 já registada na base de dados. */
  @IsEmail()
  email!: string;
}

/** DTO de POST /auth/email/login — login normal com password já definida. */
export class EmailLoginDto {
  /** Email da conta registada. */
  @IsEmail()
  email!: string;

  /** Password em claro; comparada com bcrypt no backend. */
  @IsString()
  @MinLength(1)
  password!: string;
}

/** DTO de POST /auth/email/set-password — onboarding do primeiro login por email. */
export class SetPasswordDto {
  /** ID interno devolvido por /auth/email/start quando status='setup'. */
  @IsString()
  userId!: string;

  /** Código OTP mantido apenas por compatibilidade com o cliente; não é usado na nova onboarding. */
  @IsString()
  code!: string;

  /** Nova password a definir; mínimo 8 caracteres. */
  @IsString()
  @MinLength(8)
  password!: string;
}
