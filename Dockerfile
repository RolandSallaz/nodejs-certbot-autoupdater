FROM node:22-alpine

# Устанавливаем необходимые пакеты, включая Python и Certbot
RUN apk add --no-cache python3 py3-pip certbot

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Запускаем только приложение
CMD ["node", "dist/app.js"]