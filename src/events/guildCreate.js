'use strict';

module.exports = (client, guild) => client._ready ? guild.findCreateFind() : undefined;
