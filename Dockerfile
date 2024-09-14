# Stage 1: Install dependencies and build the app
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .
RUN yarn build

# Stage 2: Install production dependencies
FROM node:20-alpine AS production-dependencies
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

# Stage 3: Prepare the final image
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY package.json ./

RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["yarn", "start"]