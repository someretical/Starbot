'use strict';

module.exports = message => message.channel.awaiting.add(message.author.id);
