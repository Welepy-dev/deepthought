import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

/**
 * Serviço reutilizável de notificações.
 * Centraliza a criação de notificações para todos os módulos.
 * Usado por: AchievementsService, ProjectsService, AuthService.
 *
 * Tipos suportados:
 * - FRIEND_REQUEST / FRIEND_ACCEPTED
 * - HELP_REQUEST
 * - PROJECT_UPDATE
 * - ACHIEVEMENT_UNLOCKED
 * - SYSTEM
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    /** Acesso à base de dados para criar e listar notificações */
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Cria uma nova notificação para um utilizador.
   * Método base usado por todos os outros métodos específicos.
   * @param userId ID do utilizador destinatário
   * @param type Tipo da notificação (enum NotificationType)
   * @param title Título curto da notificação
   * @param message Mensagem opcional com mais detalhe
   */
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message?: string,
  ) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          isRead: false,
        },
      });

      this.logger.debug(`Notification created for user ${userId}: [${type}] ${title}`);
      return notification;
      } catch (error) {
            const message =
            error instanceof Error ? error.message : String(error);

            this.logger.error(
            `Failed to create notification for user ${userId}: ${message}`,
            );
            return null;
        }
  }

  /**
   * Notifica o desbloqueio de uma conquista.
   * @param userId ID do utilizador
   * @param achievementTitle Nome da conquista
   * @param xpReward XP atribuído pela conquista
   */
  async notifyAchievementUnlocked(
    userId: string,
    achievementTitle: string,
    xpReward: number,
  ) {
    return this.create(
      userId,
      NotificationType.ACHIEVEMENT_UNLOCKED,
      `🏆 Conquista desbloqueada: ${achievementTitle}`,
      xpReward > 0 ? `+${xpReward} XP ganho` : undefined,
    );
  }

  /**
   * Notifica que alguém ofereceu ajuda num projecto.
   * @param userId ID do utilizador que pediu ajuda
   * @param helperLogin Login de quem ofereceu ajuda
   * @param projectName Nome do projecto
   */
  async notifyHelpOffered(
    userId: string,
    helperLogin: string,
    projectName: string,
  ) {
    return this.create(
      userId,
      NotificationType.HELP_REQUEST,
      `${helperLogin} ofereceu ajuda no ${projectName}`,
    );
  }

  /**
   * Notifica que um pedido de amizade foi aceite.
   * @param userId ID do utilizador destinatário
   * @param acceptorLogin Login de quem aceitou
   */
  async notifyFriendAccepted(userId: string, acceptorLogin: string) {
    return this.create(
      userId,
      NotificationType.FRIEND_ACCEPTED,
      `${acceptorLogin} aceitou o teu pedido de amizade`,
    );
  }

  /**
   * Notifica um pedido de amizade recebido.
   * @param userId ID do utilizador destinatário
   * @param requesterLogin Login de quem enviou o pedido
   */
  async notifyFriendRequest(userId: string, requesterLogin: string) {
    return this.create(
      userId,
      NotificationType.FRIEND_REQUEST,
      `${requesterLogin} enviou-te um pedido de amizade`,
    );
  }

  /**
   * Lista as notificações de um utilizador (paginadas).
   * @param userId ID do utilizador
   * @param onlyUnread Se verdadeiro, retorna apenas não lidas
   */
  async findAll(userId: string, onlyUnread = false) {
    const where: any = { userId };
    if (onlyUnread) {
      where.isRead = false;
    }

    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50, // Limite de 50 notificações por pedido
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data: notifications, total };
  }

  /**
   * Marca uma ou todas as notificações como lidas.
   * @param userId ID do utilizador (garante que só marca as suas)
   * @param notificationId ID específico ou undefined para marcar todas
   */
  async markAsRead(userId: string, notificationId?: string) {
    const where: any = { userId };
    if (notificationId) {
      where.id = notificationId;
    }

    await this.prisma.notification.updateMany({
      where,
      data: { isRead: true },
    });
  }
}