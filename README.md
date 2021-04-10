# Starbot
This is the repository for the Starbot Discord bot.

## Environment variables
```ini
# Discord
DISCORD_TOKEN=

# Sequelize
PGSTRING=
DIALECT=
```

## Create http server
```js
const server = require('http').createServer((req, res) => {
  res.writeHead(200);
  res.end('ok');
}).listen(3000);
```
