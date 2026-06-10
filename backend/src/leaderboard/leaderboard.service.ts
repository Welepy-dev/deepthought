import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';

/**
 * Serviço de leaderboard.
 * Calcula rankings por XP, nível e conquistas.
 * Inclui a posição do utilizador autenticado em cada ranking.
 */
@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    /** Acesso à base de dados */
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Ranking por XP descendente.
   * GET /leaderboard/xp
   * Retorna posição do utilizador autenticado no ranking global.
   * @param query Parâmetros de paginação
   * @param currentUserId ID do utilizador autenticado (para calcular posição)
   */
  async getXpLeaderboard(query: LeaderboardQueryDto, currentUserId: string) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Filtro base: exclui utilizadores banidos do ranking
    const where = { isBanned: false };

    // Executa queries em paralelo
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        // Ordena por XP descendente; usa nível como critério de desempate
        orderBy: [{ xp: 'desc' }, { level: 'desc' }],
        select: {
          id: true,
          login: true,
          displayName: true,
          avatar: true,
          campus: true,
          coalition: true,
          level: true,
          xp: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Calcula a posição do utilizador autenticado no ranking global com o mesmo desempate da lista.
    const userPosition = await this.getUserPosition(currentUserId, 'xp');

    // Adiciona posição sequencial a cada entrada do ranking
    const rankedUsers = users.map((user, index) => ({
      ...user,
      position: skip + index + 1,
    }));

    return {
      data: rankedUsers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        currentUserPosition: userPosition,
      },
    };
  }

  /**
   * Ranking por número de conquistas desbloqueadas.
   * GET /leaderboard/achievements
   * @param query Parâmetros de paginação
   * @param currentUserId ID do utilizador autenticado
   */
  async getAchievementsLeaderboard(query: LeaderboardQueryDto, currentUserId: string) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Usa groupBy para contar conquistas por utilizador
    // Nota: Prisma não suporta groupBy com relações directamente, usamos raw query
    const [rankingRaw, total] = await this.prisma.$transaction([
      // Raw query para obter o ranking com count de conquistas
      this.prisma.$queryRaw<Array<{
        userId: string;
        achievementCount: bigint;
      }>>`
        SELECT 
          ua."userId",
          COUNT(ua."achievementId")::int AS "achievementCount"
        FROM "UserAchievement" ua
        JOIN "User" u ON u.id = ua."userId"
        WHERE u."isBanned" = false
        GROUP BY ua."userId"
        ORDER BY "achievementCount" DESC, ua."userId"
        LIMIT ${limit} OFFSET ${skip}
      `,
      // Conta total de utilizadores com pelo menos uma conquista
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT ua."userId")::int AS count
        FROM "UserAchievement" ua
        JOIN "User" u ON u.id = ua."userId"
        WHERE u."isBanned" = false
      `,
    ]);

    // Busca os dados completos dos utilizadores no ranking numa única query.
    const userIds = rankingRaw.map((r) => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        login: true,
        displayName: true,
        avatar: true,
        campus: true,
        coalition: true,
        level: true,
        xp: true,
      },
    });

    /** Mapa evita find() por linha e preserva a ordem calculada pela raw query. */
    const usersById = new Map(users.map((user) => [user.id, user]));

    // Combina os dados de utilizador com o count de conquistas e posição.
    const ranked = rankingRaw.map((r, index) => {
      /** A query base já filtra users válidos, mas o fallback mantém a resposta defensiva. */
      const user = usersById.get(r.userId);
      return {
        ...user,
        achievementCount: Number(r.achievementCount),
        position: skip + index + 1,
      };
    });

    // Calcula a posição do utilizador autenticado no mesmo ranking por contagem.
    const userPositionRaw = await this.prisma.$queryRaw<[{ position: bigint }]>`
      SELECT COUNT(*) + 1 AS position
      FROM (
        SELECT ua."userId", COUNT(*) AS cnt
        FROM "UserAchievement" ua
        JOIN "User" u ON u.id = ua."userId"
        WHERE u."isBanned" = false
        GROUP BY ua."userId"
        HAVING COUNT(*) > (
          SELECT COUNT(*) FROM "UserAchievement" WHERE "userId" = ${currentUserId}
        )
      ) ranked
    `;

    return {
      data: ranked,
      meta: {
        total: Number(total[0]?.count ?? 0),
        page,
        limit,
        totalPages: Math.ceil(Number(total[0]?.count ?? 0) / limit),
        currentUserPosition: Number(userPositionRaw[0]?.position ?? 0),
      },
    };
  }

  /**
   * Ranking por nível descendente.
   * GET /leaderboard/level
   * @param query Parâmetros de paginação
   * @param currentUserId ID do utilizador autenticado
   */
  async getLevelLeaderboard(query: LeaderboardQueryDto, currentUserId: string) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = { isBanned: false };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        // Ordena por nível descendente; XP como critério de desempate
        orderBy: [{ level: 'desc' }, { xp: 'desc' }],
        select: {
          id: true,
          login: true,
          displayName: true,
          avatar: true,
          campus: true,
          coalition: true,
          level: true,
          xp: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    /** Usa o mesmo critério de desempate da query principal. */
    const userPosition = await this.getUserPosition(currentUserId, 'level');

    const rankedUsers = users.map((user, index) => ({
      ...user,
      position: skip + index + 1,
    }));

    return {
      data: rankedUsers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        currentUserPosition: userPosition,
      },
    };
  }

  // ─────────────────────────────────────────────────────────
  // UTILITÁRIOS PRIVADOS
  // ─────────────────────────────────────────────────────────

  /**
   * Calcula a posição global do utilizador num ranking específico.
   * Conta quantos utilizadores não banidos têm valor maior que o do utilizador.
   * @param userId ID do utilizador
   * @param field Campo a ordenar ('xp' | 'level')
   */
  private async getUserPosition(
    userId: string,
    field: 'xp' | 'level',
  ): Promise<number> {
    // Busca os valores actuais do utilizador para aplicar o mesmo desempate da listagem.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, xp: true, level: true },
    });

    if (!user) return 0;

    /** XP usa level como desempate; level usa XP como desempate. */
    const primaryValue = user[field];
    const tieBreakerField = field === 'xp' ? 'level' : 'xp';
    const tieBreakerValue = user[tieBreakerField];

    // Conta quem fica estritamente à frente considerando valor, desempate e ID estável.
    const ahead = await this.prisma.user.count({
      where: {
        isBanned: false,
        OR: [
          { [field]: { gt: primaryValue } },
          {
            [field]: primaryValue,
            [tieBreakerField]: { gt: tieBreakerValue },
          },
          {
            [field]: primaryValue,
            [tieBreakerField]: tieBreakerValue,
            id: { lt: user.id },
          },
        ],
      },
    });

    return ahead + 1;
  }
}
