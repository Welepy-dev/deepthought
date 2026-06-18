# Build stage: compila NestJS e gera o Prisma Client com dependências completas.
FROM node:20-alpine AS builder

# Mantém o trabalho isolado em /app para facilitar cache e cópia seletiva.
WORKDIR /app

# Copia apenas manifests primeiro para aproveitar o cache de `npm ci`.
COPY package*.json ./

# Instala dependências exactas do lockfile, incluindo devDependencies usadas no build.
RUN npm ci --no-audit --no-fund

# Copia o schema Prisma antes de gerar o client tipado.
COPY prisma ./prisma

# Gera o client do Prisma antes do TypeScript compilar.
RUN npx prisma generate

# Copia o restante do código só depois das dependências estarem prontas.
COPY . .

# Compila o NestJS para `dist/`.
RUN npm run build

# Remove devDependencies para reduzir a imagem final sem instalar novamente.
RUN npm prune --omit=dev && npm cache clean --force

# Runtime stage: fica apenas com o necessário para executar o backend compilado.
FROM node:20-alpine AS runner

# Define ambiente de produção para scripts e bibliotecas do Node.
ENV NODE_ENV=production

# Diretório de execução do serviço NestJS.
WORKDIR /app

# Copia os node_modules já podados para produção.
COPY --from=builder /app/node_modules ./node_modules

# Copia package.json para manter metadata e eventuais comandos internos.
COPY package*.json ./

# Copia o schema e migrations para permitir `prisma migrate deploy` no arranque.
COPY prisma ./prisma

# Copia apenas o build compilado, não o TypeScript fonte.
COPY --from=builder /app/dist ./dist

# O backend continua interno ao Docker; só o NGINX publica esta porta ao exterior.
EXPOSE 3000

# Aplica migrations pendentes e arranca o NestJS já compilado.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
