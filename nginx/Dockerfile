# NGINX edge container: termina TLS e encaminha o tráfego para frontend/backend internos.
FROM nginx:1.27-alpine

# Copia a configuração principal do reverse proxy.
COPY nginx.conf /etc/nginx/nginx.conf

# Prepara a pasta dos certificados autoassinados usados em desenvolvimento.
RUN mkdir -p /etc/nginx/ssl

# Copia os certificados colocados em `nginx/ssl/`.
COPY ssl/cert.pem /etc/nginx/ssl/cert.pem
COPY ssl/privkey.pem /etc/nginx/ssl/privkey.pem

# NGINX publica HTTP e HTTPS.
EXPOSE 80 443

# Usa a configuração copiada acima.
CMD ["nginx", "-g", "daemon off;"]
