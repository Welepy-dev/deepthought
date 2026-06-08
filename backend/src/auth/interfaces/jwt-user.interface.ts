import type { Request } from 'express';
import type { Role } from '@prisma/client';

/**
 * Representa o utilizador autenticado que fica disponível em `request.user`
 * depois de o `JwtStrategy.validate()` validar o JWT e consultar a base de dados.
 */
export interface JwtUser {
  /**
   * ID interno do utilizador na base de dados.
   *
   * O nome `sub` segue a convenção JWT "subject" e mantém compatibilidade
   * com o payload assinado pelo `AuthService`.
   */
  sub: string;

  /**
   * Role actual do utilizador lido da base de dados.
   *
   * Este valor não deve ser confiado apenas a partir do token, porque o role
   * pode mudar depois de o JWT ter sido emitido.
   */
  role: Role;

  /**
   * Estado actual de banimento lido da base de dados.
   *
   * Guards e controllers podem usar este campo sem voltar a consultar o user.
   */
  isBanned: boolean;

  /**
   * Login da 42 usado para identificar o utilizador em respostas e logs.
   */
  login: string;

  /**
   * Nome público apresentado pela aplicação.
   */
  displayName: string;

  /**
   * Access token OAuth2 da 42, quando o JWT interno foi emitido com esse valor.
   *
   * Este campo é opcional porque nem todos os JWTs precisam de carregar tokens
   * de serviços externos.
   */
  accessToken?: string;
}

/**
 * Request HTTP autenticado.
 *
 * Extende o `Request` do Express para que `request.user` deixe de ser `any`
 * em guards, decorators e controllers protegidos por JWT.
 */
export interface JwtRequest extends Request {
  /**
   * Utilizador autenticado injectado pelo Passport quando o JwtStrategy retorna
   * um `JwtUser` válido.
   */
  user: JwtUser;
}
