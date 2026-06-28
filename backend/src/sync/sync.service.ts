import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FortyTwoService } from '../integrations/fortytwo/fortytwo.service';
import { AchievementsService } from '../achievements/achievements.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  MappedFortyTwoProfile,
  MappedProject,
} from '../integrations/fortytwo/fortytwo.interfaces';
import { Prisma, ProjectStatus } from '@prisma/client';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private readonly inFlightSyncs = new Map<string, Promise<void>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly fortyTwoService: FortyTwoService,
    private readonly achievementsService: AchievementsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async syncUser(userId: string, accessToken: string): Promise<void> {
    return this.runExclusiveSync(userId, async () => {
      this.logger.log(`Starting sync for user ${userId}`);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, fortyTwoId: true },
      });

      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      const profile = await this.fortyTwoService.getMe(accessToken);

      if (profile.fortyTwoId !== user.fortyTwoId) {
        throw new NotFoundException(`User ${userId} does not match 42 token`);
      }

      await this.persistMappedProfile(userId, profile);
    });
  }

  async syncFromProfile(
    userId: string,
    profile: MappedFortyTwoProfile,
  ): Promise<void> {
    return this.runExclusiveSync(userId, async () => {
      this.logger.log(`Starting profile-based sync for user ${userId}`);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, fortyTwoId: true },
      });

      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      if (profile.fortyTwoId !== user.fortyTwoId) {
        throw new NotFoundException(`User ${userId} does not match 42 profile`);
      }

      await this.persistMappedProfile(userId, profile);
    });
  }

  private async updateUserData(
    tx: Prisma.TransactionClient,
    userId: string,
    profile: MappedFortyTwoProfile,
  ): Promise<void> {
    await tx.user.update({
      where: { id: userId },
      data: {
        displayName: profile.displayName,
        avatar: profile.avatar,
        campus: profile.campus,
        coalition: profile.coalition,
        level: profile.level,
        evalPoints: profile.evalPoints,
        xp: Math.round(profile.level * 1000),
        lastSyncAt: new Date(),
      },
    });
  }

  private async syncProjects(
    tx: Prisma.TransactionClient,
    userId: string,
    projects: MappedProject[],
  ): Promise<void> {
    for (const proj of projects) {
      const project = await tx.project.upsert({
        where: { slug: proj.slug },
        create: {
          name: proj.name,
          slug: proj.slug,
        },
        update: {
          name: proj.name,
        },
      });

      const status: ProjectStatus = proj.status;

      await tx.userProject.upsert({
        where: {
          userId_projectId: {
            userId,
            projectId: project.id,
          },
        },
        create: {
          userId,
          projectId: project.id,
          status,
          finalMark: proj.finalMark,
          validatedAt: proj.validatedAt,
        },
        update: {
          status,
          finalMark: proj.finalMark,
          validatedAt: proj.validatedAt,
        },
      });
    }

    this.logger.debug(`Synced ${projects.length} projects for user ${userId}`);
  }

  private async persistMappedProfile(
    userId: string,
    profile: MappedFortyTwoProfile,
  ): Promise<void> {
    this.logger.log(`Syncing profile for login: ${profile.login}`);

    await this.prisma.$transaction(async (tx) => {
      await this.updateUserData(tx, userId, profile);

      await this.syncProjects(tx, userId, profile.projects);
    });

    try {
      await this.achievementsService.checkAchievements(userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Achievement check failed for user ${userId}: ${message}`);
    }

    this.logger.log(`Sync completed for user ${userId}`);
  }

  private runExclusiveSync(
    userId: string,
    task: () => Promise<void>,
  ): Promise<void> {
    const existingSync = this.inFlightSyncs.get(userId);

    if (existingSync) {
      this.logger.debug(`Reusing in-flight sync for user ${userId}`);
      return existingSync;
    }

    const syncPromise = task().finally(() => {
      this.inFlightSyncs.delete(userId);
    });

    this.inFlightSyncs.set(userId, syncPromise);

    return syncPromise;
  }
}
