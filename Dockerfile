FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY prisma ./prisma

RUN npm ci --omit=dev && npm cache clean --force

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "docker-start"]