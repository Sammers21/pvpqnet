FROM node:22.5.1
WORKDIR /b
COPY package.json ./
RUN npm install
COPY . .
RUN REACT_APP_BASE_API_URL=https://pvpq.net npm run build
EXPOSE 9001
CMD ["npm", "run", "express"]