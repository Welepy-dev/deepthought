import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * Módulo do Project Board.
 * Gere o estado de projectos, pedidos e ofertas de ajuda.
 */
@Module({
  imports: [PrismaModule, AchievementsModule, NotificationsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}