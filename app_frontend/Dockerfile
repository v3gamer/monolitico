FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Construir Angular en producción
RUN npm run build --prod

# Instalar http-server globalmente
RUN npm install -g http-server

EXPOSE 4200

CMD ["http-server", "dist/app_frontend/browser", "-p", "4200"]
