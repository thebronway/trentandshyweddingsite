# Stage 1: Build the Astro SSR site
FROM node:20 AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Node AND Nginx
FROM node:20 AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./

# We need the schema and config available at runtime so Drizzle can push to the DB
COPY drizzle.config.ts ./
COPY src/db ./src/db

COPY nginx.conf /etc/nginx/sites-available/default

EXPOSE 80

ENV HOST=127.0.0.1
ENV PORT=4321
ENV NODE_ENV=production

# The clean startup sequence: just start Nginx and Node!
CMD ["sh", "-c", "npm run db:push && service nginx start && node ./dist/server/entry.mjs"]