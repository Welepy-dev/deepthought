import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { JwtUser } from '../interfaces/jwt-user.interface';

/**
 * Guard JWT — protege endpoints que requerem autenticação.
 *
 * Valida o token JWT enviado no header Authorization: Bearer <token>.
 * Após validação, adiciona req.user com os dados do payload JWT
 * (sub, role, accessToken).
 *
 * Também verifica se o utilizador está banido e rejeita o acesso.
 *
 * Uso:
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@Req() req) { return req.user; }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Sobrescreve o método `handleRequest` chamado pelo AuthGuard do Passport.
   *
   * O Passport entrega aqui:
   * - `err`: erro técnico ocorrido durante autenticação.
   * - `user`: valor retornado por `JwtStrategy.validate()`.
   * - `info`: informação adicional do Passport, por exemplo token expirado.
   *
   * O retorno deste método é atribuído a `request.user`.
   */
  handleRequest<TUser = JwtUser>(
    err: Error | null,
    user: JwtUser | false | null,
    info: Error | null,
    context: ExecutionContext,
    status?: unknown,
  ): TUser {
    /**
     * Estes parâmetros fazem parte da assinatura oficial do Passport guard.
     * Não são necessários para a regra actual, mas mantê-los preserva
     * compatibilidade com a classe base `AuthGuard('jwt')`.
     */
    void info;
    void context;
    void status;

    /**
     * Sem user válido, o request não está autenticado.
     * Mantemos a mensagem genérica para não revelar detalhes sobre tokens.
     */
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or missing JWT token');
    }

    /**
     * Utilizadores banidos devem receber 401 Unauthorized, conforme requisito.
     * A mesma regra existe na strategy, mas esta verificação torna o guard
     * robusto caso a strategy venha a mudar ou seja mockada em testes.
     */
    if (user.isBanned) {
      throw new UnauthorizedException('User account is banned');
    }

    /**
     * Devolver o `JwtUser` faz com que o Nest/Passport o exponha como
     * `request.user` para controllers, decorators e guards seguintes.
     */
    return user as TUser;
  }
}
