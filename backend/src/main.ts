import 'dotenv/config';
import { setDefaultResultOrder } from 'dns';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { buildCorsOrigins } from './common/cors-origins.util';
import { join } from 'path';

async function bootstrap() {
  // Força IPv4 primeiro para evitar problemas de rede em Docker
  setDefaultResultOrder('ipv4first');

  // Cria aplicação Nest com suporte Express
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Permite que o Nest confie no proxy (NGINX)
  // Necessário para HTTPS correto atrás de reverse proxy
  (app.getHttpAdapter().getInstance() as {
    set: (key: string, value: unknown) => void;
  }).set('trust proxy', 1);

  // Configuração de CORS baseada em util externo
  app.enableCors({
    origin: buildCorsOrigins(), // CORRIGIDO: agora vem do utils
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Servir ficheiros estáticos (uploads)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  // Validação global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove campos não definidos nos DTOs
      transform: true, // transforma payloads automaticamente
    }),
  );

  // Inicia servidor
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();