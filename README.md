[![Backend build](https://github.com/Sammers21/pvpqnet/actions/workflows/backend-build.yml/badge.svg)](https://github.com/Sammers21/pvpqnet/actions/workflows/backend-build.yml)
[![Frontend build](https://github.com/Sammers21/pvpqnet/actions/workflows/frontend-build.yml/badge.svg)](https://github.com/Sammers21/pvpqnet/actions/workflows/frontend-build.yml)
# pvpq.net
https://pvpq.net is a comprehensive website that provides real-time updates on ladder activity and PvP ladder data for World of Warcraft's PvP segment. It offers detailed information on player rankings, win rates, and other statistics, as well as helpful resources and tools for players looking to improve their PvP skills. Whether you're a seasoned veteran or a beginner, Pvpq.net is the ultimate resource for all things PvP in World of Warcraft.

One of the standout features of Pvpq.net is its ability to show ladder activity and PvP ladder data for every PvP bracket. This includes 2v2, 3v3, shuffle, and rated battlegrounds. Players can easily track their progress and see where they stand in the rankings for their chosen bracket.

In addition to ladder activity and PvP ladder data, Pvpq.net also has a section dedicated to showing the current in-game meta. This is incredibly helpful for players who want to stay up-to-date with the latest trends and strategies in World of Warcraft's PvP segment. By keeping an eye on the meta, players can adjust their playstyle and team composition to stay competitive.

Another great feature of Pvpq.net is its player profiles section. Here, players can view detailed information about other players, including their win rates, favorite classes, and more. This can be incredibly helpful for players who want to learn from others or find new teammates to play with.

Overall, Pvpq.net is an incredibly useful website for anyone interested in World of Warcraft's PvP segment. With its real-time updates, detailed statistics, and helpful resources, it's the ultimate resource for players looking to improve their PvP skills and climb the ranks.
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
