# Build stage — compile TypeScript with dev dependencies
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Runtime stage — production dependencies + compiled output only
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node

# Browser voice gateway (default). For the remote MCP server, override with:
#   docker run ... node dist/mcp-server.js
EXPOSE 8765 8766
CMD ["node", "dist/index.js"]
