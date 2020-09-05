'use strict';

module.exports = guild => guild.client._ready ? guild.findCreateFind() : undefined;
