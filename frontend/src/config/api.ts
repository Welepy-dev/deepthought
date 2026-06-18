/**
 * URL pública do backend usada pelo browser.
 *
 * O browser fala com o backend através do mesmo origin HTTPS e o NGINX faz
 * o proxy de `/api` para o NestJS. Isso evita CORS e remove dependência de ngrok.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
