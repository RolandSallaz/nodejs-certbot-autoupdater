FROM node:22-alpine
RUN apk add --no-cache bash certbot python3 py3-pip


WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Запускаем только приложение
CMD ["node", "dist/app.js"]