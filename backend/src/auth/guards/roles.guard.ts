import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { JwtRequest } from '../interfaces/jwt-user.interface';

/**
 * Guard que verifica se o utilizador autenticado tem o role necessário
 * para aceder a um endpoint específico.
 *
 * Deve ser usado APÓS o JwtAuthGuard (que garante que req.user existe).
 * Lê os roles definidos pelo decorator @Roles() nos metadados do handler.
 *
 * Se nenhum role for definido no endpoint, permite o acesso.
 *
 * @example
 * // Aplicar globalmente em conjunto com JwtAuthGuard
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(Role.ADMIN)
 * @Get()
 * adminEndpoint() {}
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    /** Reflector permite ler os metadados definidos pelos decorators */
    private readonly reflector: Reflector,
  ) {}

  /**
   * Decide se o request actual pode executar o handler.
   *
   * Fluxo:
   * 1. Lê os roles definidos por `@Roles(...)` no método ou na classe.
   * 2. Permite o request se não houver roles exigidos.
   * 3. Lê `request.user`, que deve ter sido preenchido pelo `JwtAuthGuard`.
   * 4. Bloqueia utilizadores banidos como defesa extra.
   * 5. Confirma que o role actual do utilizador está na lista permitida.
   */
  canActivate(context: ExecutionContext): boolean {
    /**
     * `getAllAndOverride` procura primeiro metadados no handler e depois na
     * classe. Isto permite que um método sobrescreva roles definidos no
     * controller inteiro.
     */
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    /**
     * Se não houver `@Roles(...)`, este guard não impõe RBAC.
     * O endpoint pode continuar protegido apenas por `JwtAuthGuard`.
     */
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    /**
     * Extrai o utilizador autenticado do request com tipagem forte.
     * Este valor é injectado pelo Passport com o retorno do JwtStrategy.
     */
    const { user } = context.switchToHttp().getRequest<JwtRequest>();

    if (!user) {
      throw new UnauthorizedException('No authenticated user found');
    }

    /**
     * Defesa em profundidade: se este guard for usado depois de outro fluxo que
     * preencha `request.user`, utilizadores banidos continuam sem acesso.
     */
    if (user.isBanned) {
      throw new UnauthorizedException('User account is banned');
    }

    /**
     * Verifica se o role actual do user, vindo da base de dados, está autorizado
     * para o endpoint.
     */
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required role(s): ${requiredRoles.join(', ')}. Your role: ${user.role}`,
      );
    }

    return true;
  }
}
