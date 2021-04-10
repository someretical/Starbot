'use strict';

module.exports = message => message.channel.awaiting.delete(message.author.id);
