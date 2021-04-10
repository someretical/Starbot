'use strict';

module.exports = message => message.channel.awaiting.has(message.author.id);
