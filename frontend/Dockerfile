FROM oven/bun:1 AS build
WORKDIR /b
COPY package.json package-lock.json ./
RUN bun install --frozen-lockfile
COPY . .
RUN REACT_APP_BASE_API_URL=https://pvpq.net bun run build

FROM oven/bun:1
WORKDIR /b
COPY package.json package-lock.json ./
RUN bun install --production --frozen-lockfile
COPY --from=build /b/dist ./dist
COPY server.js ./
EXPOSE 9001
CMD ["bun", "run", "server.js"]