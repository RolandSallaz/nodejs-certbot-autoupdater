FROM node:22-alpine

RUN apk add --no-cache bash certbot python3 py3-pip

WORKDIR /app

COPY package*.json ./
COPY . .
RUN npm install

CMD ["node", "dist/app.js"]