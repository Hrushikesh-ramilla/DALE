FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npx esbuild scripts/worker.ts --bundle --platform=node --format=cjs --external:pg --external:@electric-sql/pglite --external:@aws-sdk/client-s3 --outfile=.next/standalone/worker.cjs

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
RUN mkdir -p /app/.next/cache /data && chown -R node:node /app/.next/cache /data
USER node
EXPOSE 3000
CMD ["node", "server.js"]
