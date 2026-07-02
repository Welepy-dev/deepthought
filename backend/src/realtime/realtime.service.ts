import { Injectable, Logger } from '@nestjs/common';
import type { Server } from 'socket.io';

/** Nome da sala pessoal de um utilizador (uma por conta, todas as sessões). */
export function userRoom(userId: string): string {
  return `user:${userId}`;
}

/**
 * Ponte entre serviços HTTP e o servidor socket.io.
 *
 * Não tem dependências: o WorldGateway regista aqui o `Server` no arranque
 * (setServer) e qualquer módulo pode emitir para a sala pessoal de um
 * utilizador sem importar o GatewayModule — evitando o ciclo
 * Notifications → Gateway → Auth → Sync → Notifications.
 */
@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  /** Servidor socket.io registado pelo gateway; null até o WS arrancar. */
  private server: Server | null = null;

  /** Chamado uma vez pelo WorldGateway em afterInit. */
  setServer(server: Server): void {
    this.server = server;
  }

  /**
   * Emite um evento para todas as sessões ligadas de um utilizador.
   * Sem servidor (arranque) ou sem sessões, é um no-op silencioso —
   * o dado persistido continua a ser a fonte de verdade.
   */
  emitToUser(userId: string, event: string, payload: unknown): void {
    if (!this.server) {
      this.logger.debug(`Socket server not ready; skipped ${event} for ${userId}`);
      return;
    }

    this.server.to(userRoom(userId)).emit(event, payload);
  }
}
