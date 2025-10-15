FROM node:22.5.1 AS build
WORKDIR /b
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN REACT_APP_BASE_API_URL=https://pvpq.net npm run build

FROM node:22.5.1
WORKDIR /b
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /b/build ./build
COPY server.js ./
EXPOSE 9001
CMD ["npm", "run", "express"]