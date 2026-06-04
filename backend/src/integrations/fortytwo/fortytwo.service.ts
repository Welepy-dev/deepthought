import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import {
  FortyTwoProfile,
  FortyTwoCoalition,
  MappedFortyTwoProfile,
  MappedProject,
  FortyTwoCursusUser,
  FortyTwoProjectUser,
} from './fortytwo.interfaces';

/**
 * Serviço responsável por toda a comunicação com a API v2 da 42.
 * Encapsula as chamadas HTTP, trata erros e mapeia as respostas
 * para DTOs internos utilizados pelo resto da aplicação.
 */
@Injectable()
export class FortyTwoService {
  /** Logger específico para este serviço */
  private readonly logger = new Logger(FortyTwoService.name);

  /** URL base da API v2 da intranet 42 */
  private readonly BASE_URL = 'https://api.intra.42.fr/v2';

  /** ID do cursus principal da 42 (42cursus = 21) */
  private readonly MAIN_CURSUS_ID = 21;

  // ─────────────────────────────────────────────────────────
  // MÉTODOS PÚBLICOS
  // ─────────────────────────────────────────────────────────

  /**
   * Busca o perfil completo do utilizador autenticado
   * através do endpoint /v2/me e mapeia para DTO interno.
   * @param accessToken Token OAuth2 da sessão 42
   * @returns Perfil mapeado com dados consolidados
   */
  async getMe(accessToken: string): Promise<MappedFortyTwoProfile> {
    this.logger.log('Fetching /v2/me from 42 API');

    // Busca o perfil completo — inclui campus, cursus_users e projects_users
    const profile = await this.fetchFromApi<FortyTwoProfile>('/me', accessToken);

    // Busca coligação separadamente (endpoint diferente)
    const coalition = await this.getCoalition(profile.id, accessToken);

    // Mapeia o perfil bruto da API para o DTO interno
    return this.mapProfile(profile, coalition);
  }

  /**
   * Busca a coligação do utilizador.
   * Retorna null se o utilizador não tiver coligação.
   * @param userId ID numérico do utilizador na 42
   * @param accessToken Token OAuth2
   */
  async getCoalition(
    userId: number,
    accessToken: string,
  ): Promise<FortyTwoCoalition | null> {
    try {
      const coalitions = await this.fetchFromApi<FortyTwoCoalition[]>(
        `/users/${userId}/coalitions`,
        accessToken,
      );
      // Retorna a primeira coligação encontrada (cada utilizador tem apenas uma)
      return coalitions.length > 0 ? coalitions[0] : null;
    } catch {
      // Utilizador sem coligação não é um erro crítico
      this.logger.warn(`No coalition found for user ${userId}`);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────
  // MÉTODOS PRIVADOS — MAPPERS
  // ─────────────────────────────────────────────────────────

  /**
   * Mapeia o perfil bruto da API 42 para o DTO interno MappedFortyTwoProfile.
   * Extrai os dados relevantes do cursus principal e lista de projetos.
   * @param profile Perfil bruto vindo da API
   * @param coalition Coligação do utilizador (pode ser null)
   */
  private mapProfile(
    profile: FortyTwoProfile,
    coalition: FortyTwoCoalition | null,
  ): MappedFortyTwoProfile {
    // Encontra o cursus principal (42cursus). Se não existir, usa o primeiro disponível
    const mainCursus =
      profile.cursus_users.find((c) => c.cursus_id === this.MAIN_CURSUS_ID) ??
      profile.cursus_users[0] ??
      null;

    // Extrai o campus primário do utilizador
    const primaryCampus = this.extractPrimaryCampus(profile);

    // Mapeia os projetos do cursus principal
    const projects = this.mapProjects(profile.projects_users);

    return {
      fortyTwoId: profile.id,
      login: profile.login,
      email: profile.email,
      displayName: profile.displayname || profile.usual_full_name,
      avatar: profile.image?.link ?? null,
      campus: primaryCampus,
      level: mainCursus?.level ?? 0,
      evalPoints: profile.correction_point ?? 0,
      projects,
    };
  }

  /**
   * Extrai o nome do campus primário do utilizador.
   * Utiliza o campo campus_users para determinar qual é o principal.
   * @param profile Perfil bruto da API
   */
  private extractPrimaryCampus(profile: FortyTwoProfile): string | null {
    // Tenta encontrar o campus marcado como primário
    const primaryCampusUser = profile.campus_users?.find((cu) => cu.is_primary);

    if (primaryCampusUser) {
      const campus = profile.campus?.find((c) => c.id === primaryCampusUser.campus_id);
      return campus?.name ?? null;
    }

    // Fallback: primeiro campus da lista
    return profile.campus?.[0]?.name ?? null;
  }

  /**
   * Mapeia a lista de projetos da API 42 para MappedProject[].
   * Converte o status da API para o formato interno e filtra projetos relevantes.
   * @param projectsUsers Lista de projetos do utilizador
   */
  private mapProjects(projectsUsers: FortyTwoProjectUser[]): MappedProject[] {
    // Filtra apenas projetos com slug válido (ignora projetos internos da 42)
    return projectsUsers
      .filter((pu) => pu.project?.slug)
      .map((pu) => ({
        slug: pu.project.slug,
        name: pu.project.name,
        status: this.mapProjectStatus(pu.status, pu.validated),
        finalMark: pu.final_mark ?? null,
        // Converte a data de validação para objeto Date ou null
        validatedAt: pu.marked_at ? new Date(pu.marked_at) : null,
      }));
  }

  /**
   * Converte o status de projeto da API 42 para o enum interno ProjectStatus.
   * @param apiStatus Status vindo da API ('finished', 'in_progress', etc.)
   * @param validated Indica se o projeto foi validado (nota >= 50)
   */
  private mapProjectStatus(
    apiStatus: string,
    validated: boolean | null,
  ): string {
    // Mapa de conversão entre status da API 42 e enum interno
    const statusMap: Record<string, string> = {
      finished: validated ? 'FINISHED' : 'FAILED',
      in_progress: 'IN_PROGRESS',
      creating_group: 'IN_PROGRESS',
      searching_a_group: 'NOT_STARTED',
      waiting_for_correction: 'IN_PROGRESS',
      failed: 'FAILED',
    };

    return statusMap[apiStatus] ?? 'NOT_STARTED';
  }

  // ─────────────────────────────────────────────────────────
  // UTILITÁRIOS HTTP
  // ─────────────────────────────────────────────────────────

  /**
   * Método genérico para fazer pedidos autenticados à API 42.
   * Trata erros HTTP e lança exceções adequadas.
   * @param path Caminho do endpoint (ex: '/me', '/users/123/coalitions')
   * @param accessToken Token OAuth2
   * @returns Dados tipados da resposta
   */
  private async fetchFromApi<T>(path: string, accessToken: string): Promise<T> {
    const url = `${this.BASE_URL}${path}`;

    this.logger.debug(`GET ${url}`);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    // Trata resposta não autorizada (token expirado ou inválido)
    if (response.status === 401) {
      this.logger.error(`Unauthorized request to 42 API: ${url}`);
      throw new UnauthorizedException('42 API token is invalid or expired');
    }

    // Trata outros erros HTTP
    if (!response.ok) {
      const error = `42 API error: ${response.status} ${response.statusText} for ${url}`;
      this.logger.error(error);
      throw new Error(error);
    }

    return response.json() as Promise<T>;
  }
}