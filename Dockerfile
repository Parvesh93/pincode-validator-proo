FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Build tools such as @react-router/dev and Vite are dev dependencies,
# so install the full dependency set before running the production build.
RUN npm ci

COPY . .

RUN npm run build

# Remove development-only packages after the build to keep runtime lean.
RUN npm prune --omit=dev && npm cache clean --force

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "docker-start"]
