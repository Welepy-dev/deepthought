import { Module } from '@nestjs/common';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Módulo de recursos partilhados — links, PDFs, vídeos por projecto.
 */
@Module({
  imports: [PrismaModule],
  controllers: [ResourcesController],
  providers: [ResourcesService],
})
export class ResourcesModule {}