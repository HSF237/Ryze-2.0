FROM node:22.14.0-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force

FROM node:22.14.0-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S ryze && adduser -S ryze -G ryze
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=ryze:ryze package.json ./
COPY --chown=ryze:ryze src ./src
COPY --chown=ryze:ryze scripts ./scripts
COPY --chown=ryze:ryze migrations ./migrations
USER ryze
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD node -e "fetch('http://127.0.0.1:4000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["sh", "-c", "node scripts/migrate.js && node src/server.js"]
