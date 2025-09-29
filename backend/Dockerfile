# multi-stage Dockerfile for Node 22 + TypeScript backend
# builder: install dev deps and build
FROM node:22-bullseye AS builder
WORKDIR /app

# copy package metadata first for fast rebuilds
COPY package.json package-lock.json tsconfig.json ./

# install all deps (dev + prod) for build
RUN npm ci

# copy source and build
COPY . .
RUN npm run build

# runner: smaller image with only production deps + compiled output
FROM node:22-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# copy package metadata and install prod deps only
COPY package.json package-lock.json ./
RUN npm ci --only=production

# copy compiled app
COPY --from=builder /app/dist ./dist

# expose port (app uses process.env.PORT || 3000)
EXPOSE 3000

# Start app
CMD ["node", "dist/index.js"]
