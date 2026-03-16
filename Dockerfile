# Stage 1: Build the Astro SSR site
FROM node:20 AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .

# 1. Fulfill Astro's strict requirement so the build compiles successfully
ENV ASTRO_DATABASE_FILE=/app/.astro/data.db
RUN npm run build

# Stage 2: Serve with Node AND Nginx
FROM node:20 AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./

# 2. Copy the freshly built schema into a safe staging folder
COPY --from=build /app/.astro /app/db-seed
COPY nginx.conf /etc/nginx/sites-available/default

EXPOSE 80

ENV HOST=127.0.0.1
ENV PORT=4321
ENV NODE_ENV=production

# 3. Force the live server to read/write strictly inside your Docker volume
ENV ASTRO_DATABASE_FILE=/app/data/data.db

# 4. The Standard Startup Sequence: 
# Inject the schema ONLY if the volume is empty, then boot the server.
CMD ["sh", "-c", "mkdir -p /app/data && cp -n /app/db-seed/data.db /app/data/data.db 2>/dev/null || true && service nginx start && node ./dist/server/entry.mjs"]