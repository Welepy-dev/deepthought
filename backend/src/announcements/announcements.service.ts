import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAnnouncementDto } from './dto/announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
    /** Notificações SYSTEM persistidas, para quem não está ligado no momento */
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(userId: string) {
    const announcements = await this.prisma.announcement.findMany({
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: { select: { id: true, login: true, displayName: true } },
        reads: { where: { userId }, select: { id: true } },
      },
    });

    return announcements.map(({ reads, ...announcement }) => ({
      ...announcement,
      isRead: reads.length > 0,
    }));
  }

  async create(authorId: string, dto: CreateAnnouncementDto) {
    const announcement = await this.prisma.announcement.create({
      data: {
        title: dto.title,
        body: dto.body,
        pinned: dto.pinned ?? false,
        authorId,
      },
      include: {
        author: { select: { id: true, login: true, displayName: true } },
      },
    });

    this.realtime.emitToAll('announcement:new', announcement);

    /** Notificação SYSTEM persistida para todos (excepto o autor) — sobrevive a offline. */
    const recipients = await this.prisma.user.findMany({
      where: { isBanned: false, id: { not: authorId } },
      select: { id: true },
    });
    await this.notifications.notifySystemBroadcast(
      recipients.map((u) => u.id),
      `📢 ${announcement.title}`,
      announcement.body,
    );

    return announcement;
  }

  async markRead(userId: string, announcementId: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
      select: { id: true },
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement ${announcementId} not found`);
    }

    await this.prisma.announcementRead.upsert({
      where: {
        userId_announcementId: { userId, announcementId },
      },
      create: { userId, announcementId },
      update: {},
    });

    return { message: 'Announcement marked as read' };
  }

  async remove(id: string) {
    const announcement = await this.prisma.announcement.findUnique({ where: { id } });
    if (!announcement) throw new NotFoundException(`Announcement ${id} not found`);
    await this.prisma.announcement.delete({ where: { id } });
    return { message: 'Announcement deleted' };
  }
}
