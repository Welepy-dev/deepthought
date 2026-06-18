import 'dotenv/config';
import { setDefaultResultOrder } from 'dns';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  /**
   * A API da 42/Cloudflare pode devolver IPv6 primeiro em alguns ambientes Docker.
   * Como o log mostrou ENETUNREACH em IPv6, preferimos IPv4 sem desactivar IPv6 globalmente.
   */
  setDefaultResultOrder('ipv4first');

  const app = await NestFactory.create(AppModule);

  /**
   * Quando o Nest fica atrás do NGINX, o proxy define X-Forwarded-Proto/For.
   * Trust proxy permite que req.secure, cookies secure e logs reflitam HTTPS real.
   */
  /** O adaptador HTTP expõe a instância Express; o cast mantém a tipagem explícita. */
  (app.getHttpAdapter().getInstance() as {
    set: (key: string, value: unknown) => void;
  }).set('trust proxy', 1);

  /**
   * Durante o desenvolvimento e sob reverse proxy, o browser pode falar com o backend
   * por origens diferentes. Mantemos uma allowlist curta para não abrir CORS em excesso.
   */
  app.enableCors({
    origin: buildCorsOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}

/** Monta a allowlist de origens do frontend para dev local, HTTPS e Docker. */
function buildCorsOrigins(): string[] {
  /** FRONTEND_URL é o destino usado no redirect OAuth -> React. */
  const frontendUrl = process.env.FRONTEND_URL;

  /** CORS_ORIGINS permite acrescentar domínios separados por vírgula sem mexer no código. */
  const configuredOrigins =
    process.env.CORS_ORIGINS?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];

  /** Defaults seguros para o Vite local usado no projecto. */
  return [
    'https://localhost',
    'https://127.0.0.1',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...(frontendUrl ? [frontendUrl] : []),
    ...configuredOrigins,
  ];
}

bootstrap();
