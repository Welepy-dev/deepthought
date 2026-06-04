import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementsService } from '../achievements/achievements.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  UpdateProjectStatusDto,
  CreateHelpRequestDto,
  CreateHelpOfferDto,
  ProjectsQueryDto,
} from './dto/projects.dto';

/**
 * Serviço de gestão do Project Board.
 * Permite visualizar, actualizar e gerir pedidos/ofertas de ajuda em projectos.
 */
@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    /** Acesso à base de dados */
    private readonly prisma: PrismaService,
    /** Para verificar conquistas após conclusão de projecto */
    private readonly achievementsService: AchievementsService,
    /** Para criar notificações de ajuda */
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Lista projectos de todos os utilizadores com filtros e paginação.
   * GET /projects
   */
  async findAll(query: ProjectsQueryDto) {
    const { status, needHelp, campus, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Constrói o filtro dinamicamente
    const where: any = {
      // Exclui projectos de utilizadores banidos
      user: { isBanned: false },
    };

    if (status) {
      where.status = status;
    }

    // Filtro por flag needHelp
    if (needHelp !== undefined) {
      where.needHelp = needHelp;
    }

    // Filtro por campus do utilizador dono do projecto
    if (campus) {
      where.user = { ...where.user, campus: { equals: campus, mode: 'insensitive' } };
    }

    const [projects, total] = await this.prisma.$transaction([
      this.prisma.userProject.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          // Inclui dados do projecto (nome, slug)
          project: { select: { id: true, name: true, slug: true } },
          // Inclui dados públicos do utilizador
          user: {
            select: {
              id: true,
              login: true,
              displayName: true,
              avatar: true,
              campus: true,
              coalition: true,
              level: true,
            },
          },
          // Conta pedidos de ajuda abertos
          helpRequests: {
            where: { isResolved: false },
            select: { id: true },
          },
        },
      }),
      this.prisma.userProject.count({ where }),
    ]);

    return {
      data: projects.map((p) => ({
        ...p,
        openHelpRequestsCount: p.helpRequests.length,
        helpRequests: undefined, // Remove a lista completa da resposta resumida
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Retorna os detalhes completos de um UserProject.
   * GET /projects/:id
   */
  async findOne(id: string) {
    const project = await this.prisma.userProject.findUnique({
      where: { id },
      include: {
        project: true,
        user: {
          select: {
            id: true, login: true, displayName: true,
            avatar: true, campus: true, coalition: true, level: true,
          },
        },
        // Inclui todos os pedidos de ajuda com detalhes
        helpRequests: {
          orderBy: { createdAt: 'desc' },
        },
        // Inclui todas as ofertas de ajuda
        helpOffers: {
          include: {
            helper: {
              select: { id: true, login: true, displayName: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }

    return project;
  }

  /**
   * Actualiza o estado de um UserProject.
   * Apenas o dono do projecto pode actualizar.
   * PATCH /projects/:id
   * @param id ID do UserProject
   * @param userId ID do utilizador autenticado
   * @param dto Dados a actualizar
   */
  async updateStatus(id: string, userId: string, dto: UpdateProjectStatusDto) {
    // Verifica se o projecto existe e pertence ao utilizador
    const userProject = await this.prisma.userProject.findFirst({
      where: { id, userId },
    });

    if (!userProject) {
      throw new NotFoundException('Project not found or you are not the owner');
    }

    const updateData: any = { status: dto.status };

    // Regista a data de conclusão se o projecto for marcado como FINISHED
    if (dto.status === 'FINISHED') {
      updateData.validatedAt = new Date();
      if (dto.finalMark !== undefined) {
        updateData.finalMark = dto.finalMark;
      }
    }

    const updated = await this.prisma.userProject.update({
      where: { id },
      data: updateData,
      include: { project: true },
    });

    // Se o projecto foi concluído, verifica conquistas
    if (dto.status === 'FINISHED') {
      setImmediate(async () => {
        try {
          await this.achievementsService.checkAchievements(userId);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.error(`Achievement check failed: ${message}`);
        }
      });
    }

    return updated;
  }

  /**
   * Cria um pedido de ajuda num projecto.
   * POST /projects/:id/help-request
   * @param userProjectId ID do UserProject
   * @param userId ID do utilizador autenticado
   * @param dto Título e descrição do pedido
   */
  async createHelpRequest(
    userProjectId: string,
    userId: string,
    dto: CreateHelpRequestDto,
  ) {
    // Verifica se o projecto pertence ao utilizador
    const userProject = await this.prisma.userProject.findFirst({
      where: { id: userProjectId, userId },
    });

    if (!userProject) {
      throw new NotFoundException('Project not found or you are not the owner');
    }

    // Cria o pedido de ajuda e activa a flag needHelp em transacção
    const [helpRequest] = await this.prisma.$transaction([
      this.prisma.projectHelpRequest.create({
        data: {
          userProjectId,
          title: dto.title,
          description: dto.description,
        },
      }),
      // Activa a flag needHelp para aparecer nos filtros
      this.prisma.userProject.update({
        where: { id: userProjectId },
        data: { needHelp: true },
      }),
    ]);

    return helpRequest;
  }

  /**
   * Cria uma oferta de ajuda para um projecto.
   * POST /projects/:id/help-offer
   * Não pode oferecer ajuda ao próprio projecto.
   * @param userProjectId ID do UserProject
   * @param helperId ID do utilizador que oferece ajuda
   * @param dto Mensagem opcional
   */
  async createHelpOffer(
    userProjectId: string,
    helperId: string,
    dto: CreateHelpOfferDto,
  ) {
    // Busca o projecto e o dono para validações e notificações
    const userProject = await this.prisma.userProject.findUnique({
      where: { id: userProjectId },
      include: {
        user: { select: { id: true, login: true } },
        project: { select: { name: true } },
      },
    });

    if (!userProject) {
      throw new NotFoundException(`Project ${userProjectId} not found`);
    }

    // Não pode oferecer ajuda ao próprio projecto
    if (userProject.userId === helperId) {
      throw new BadRequestException('Cannot offer help to your own project');
    }

    // Cria a oferta de ajuda
    const helpOffer = await this.prisma.projectHelpOffer.create({
      data: {
        userProjectId,
        helperId,
        message: dto.message,
      },
      include: {
        helper: { select: { id: true, login: true, displayName: true, avatar: true } },
      },
    });

    // Notifica o dono do projecto
    await this.notificationsService.notifyHelpOffered(
      userProject.userId,
      helpOffer.helper.login,
      userProject.project.name,
    );

    // Verifica conquistas de ajuda para o helper
    setImmediate(async () => {
      try {
        await this.achievementsService.checkAchievements(helperId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Achievement check failed: ${message}`);
      }
    });

    return helpOffer;
  }

  /**
   * Lista pedidos de ajuda abertos (isResolved = false).
   * GET /projects/help/open
   */
  async findOpenHelpRequests(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [requests, total] = await this.prisma.$transaction([
      this.prisma.projectHelpRequest.findMany({
        where: { isResolved: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          userProject: {
            include: {
              project: { select: { id: true, name: true, slug: true } },
              user: {
                select: { id: true, login: true, displayName: true, avatar: true, campus: true },
              },
            },
          },
        },
      }),
      this.prisma.projectHelpRequest.count({ where: { isResolved: false } }),
    ]);

    return {
      data: requests,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}