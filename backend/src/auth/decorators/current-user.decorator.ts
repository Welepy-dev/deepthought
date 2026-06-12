import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type {
  JwtRequest,
  JwtUser,
} from '../interfaces/jwt-user.interface';

/**
 * Chave válida do objecto `JwtUser`.
 *
 * Usada para limitar `@CurrentUser('...')` apenas a propriedades que existem
 * realmente em `request.user`.
 */
type JwtUserProperty = keyof JwtUser;

/**
 * Implementação interna do decorator.
 *
 * O Nest chama esta função no momento em que resolve os parâmetros do handler.
 * Ela lê o request HTTP actual e devolve o utilizador inteiro ou uma propriedade
 * específica desse utilizador.
 */
const CurrentUserDecorator = createParamDecorator<
  JwtUserProperty | undefined,
  JwtUser | JwtUser[JwtUserProperty] | undefined
>((data, context): JwtUser | JwtUser[JwtUserProperty] | undefined => {
  /**
   * Obtém o request Express tipado.
   *
   * `request.user` só existirá quando o endpoint estiver protegido por
   * `JwtAuthGuard`, porque é esse guard que executa a strategy JWT.
   */
  const request = context.switchToHttp().getRequest<JwtRequest>();

  /**
   * Guarda o user numa variável local para evitar leituras repetidas e para
   * permitir optional chaining caso o decorator seja usado sem guard.
   */
  const user = request.user;

  /**
   * Sem argumento, `@CurrentUser()` devolve o objecto completo.
   */
  if (!data) {
    return user;
  }

  /**
   * Com argumento, `@CurrentUser('sub')` devolve apenas essa propriedade.
   */
  return user?.[data];
});

/**
 * Devolve o utilizador autenticado completo.
 *
 * Exemplo:
 * `getMe(@CurrentUser() user: JwtUser)`.
 */
export function CurrentUser(): ParameterDecorator;

/**
 * Devolve uma propriedade específica do utilizador autenticado.
 *
 * Exemplo:
 * `getMe(@CurrentUser('sub') userId: string)`.
 */
export function CurrentUser<Property extends JwtUserProperty>(
  property: Property,
): ParameterDecorator;

/**
 * Factory pública do decorator.
 *
 * Mantém compatibilidade com as duas formas esperadas:
 * `@CurrentUser()` e `@CurrentUser('sub')`.
 */
export function CurrentUser(property?: JwtUserProperty): ParameterDecorator {
  return CurrentUserDecorator(property);
}
