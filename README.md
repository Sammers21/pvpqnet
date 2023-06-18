# pvpq.net
https://pvpq.net is a World of Warcraft PvP data oriented web site which has the following features:
* Leaderboards with player statistics and rankings
* Activity graphs for players for the past several hours
* Support for EU and US regions and every pvp bracket

# How to run locally
The project consist of two parts: the frontend and the backend. 
In order to run the project locally you need to have [Node.js](https://nodejs.org/en/) and [MongoDB](https://www.mongodb.com/) installed as well as a [Battle.net API keys](https://dev.battle.net/).

## Backend
In order to run the backend you need to have:
1. a [MongoDB](https://www.mongodb.com/) instance running
2. [Battle.net API keys](https://dev.battle.net/): client id and secret
3. [Docker](https://www.docker.com/) installed
4. After you have the above you can run the backend with the following commands:
```
docker build -t pvpq-backend .
docker run  -e CLIENT_ID="" -e CLIENT_SECRET="" -e DB_URI="" --name pvpq -d -p9000:9000 pvpq-backend
```
**CLIENT_ID** and **CLIENT_SECRET** are the Battle.net API keys. **DB_URI** is the MongoDB connection string.

The backend will be available at http://localhost:9000. The backend will automatically create the database and populate it with data.

## Frontend
The frontend is a [React](https://reactjs.org/) application which can be run with the following commands:
```
cd frontend
npm install
REACT_APP_API_URL=http://localhost:9000 npm start
```
The frontend will be available at http://localhost:3000