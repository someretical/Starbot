'use strict';

const fs = require('fs');
const Starbot = require('./src/structures/Starbot.js');
const { CLIENT_OPTIONS } = require('./src/util/Constants.js');

for (const file of fs.readdirSync('./src/structures/extended/')) require(`./src/structures/extended/${file}`);

new Starbot(CLIENT_OPTIONS).init();
