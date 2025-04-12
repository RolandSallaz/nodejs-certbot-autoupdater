FROM node:22-alpine
RUN apk add --no-cache bash
RUN apk add --no-cache busybox
# Устанавливаем необходимые пакеты, включая Python и Certbot
RUN apk add --no-cache python3 py3-pip certbot

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Запускаем только приложение
CMD ["node", "dist/app.js"]