# Build stage: compila a SPA React com Vite.
FROM node:20-alpine AS builder

# Mantém o processo de build isolado.
WORKDIR /app

# Instala dependências exactas para build reproduzível.
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copia o código-fonte e gera os assets finais.
COPY . .
RUN npm run build

# Runtime stage: usa NGINX pequeno para servir os ficheiros estáticos.
FROM nginx:1.27-alpine AS runner

# Substitui a config por uma SPA-safe com fallback para index.html.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia apenas a pasta dist produzida pelo build do Vite.
COPY --from=builder /app/dist /usr/share/nginx/html

# O frontend escuta internamente em 80; apenas o proxy reverso externo fica exposto.
EXPOSE 80

# Mantém o NGINX em foreground.
CMD ["nginx", "-g", "daemon off;"]
