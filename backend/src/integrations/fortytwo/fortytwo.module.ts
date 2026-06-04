import { Module } from '@nestjs/common';
import { FortyTwoService } from './fortytwo.service';

/**
 * Módulo de integração com a API v2 da 42.
 * Exporta o FortyTwoService para ser usado pelo SyncModule
 * e pelo AuthModule durante o processo de login.
 */
@Module({
  providers: [FortyTwoService],
  exports: [FortyTwoService],
})
export class FortyTwoModule {}
