# Starbot
This is the repository for the Starbot Discord bot.

## Environment variables
```ini
# client options
DISCORD_TOKEN=
USER_DIRECTORY=
PREFIX=/
EMBED_COLOUR=PURPLE

# sequelize options

# production
PGSTRING=
# development
DIALECT=sqlite
STORAGE=./data/database.sqlite

# stringified JSON array
OWNERS=[]
```

## Create http server
```js
const server = require('http').createServer((req, res) => {
  res.writeHead(200);
  res.end('ok');
}).listen(3000);
```
