/**
 * Origem pública do backend (host:porta), usada para sockets e /uploads.
 *
 * Em dev via nginx/HTTPS, VITE_SERVER_ORIGIN aponta para o proxy
 * (ex.: https://localhost:8443). Sem essa env var, cai para o backend directo.
 */
export const SERVER_ORIGIN = import.meta.env.VITE_SERVER_ORIGIN ?? 'http://localhost:3000';

/** Base das rotas REST — o backend serve tudo sob /api. */
export const API_BASE_URL = `${SERVER_ORIGIN}/api`;
