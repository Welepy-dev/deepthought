import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Módulo de notificações.
 * Exporta o NotificationsService para ser usado por outros módulos:
 * - AchievementsModule
 * - ProjectsModule
 * - AuthModule (amizades)
 */
@Module({
  imports: [PrismaModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}