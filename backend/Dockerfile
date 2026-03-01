FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:16-alpine AS production
WORKDIR /app
RUN apk add --no-cache wget
RUN npm install -g pm2
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY ecosystem.config.cjs ./
EXPOSE 3000
CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]