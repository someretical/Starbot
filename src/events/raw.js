'use strict';

const { capitaliseFirstLetter } = require('../util/Util.js');

const events = [
	'MESSAGE_UPDATE',
	'MESSAGE_DELETE',
	'MESSAGE_DELETE_BULK',
	'MESSAGE_REACTION_ADD',
	'MESSAGE_REACTION_REMOVE',
	'MESSAGE_REACTION_REMOVE_ALL',
	'MESSAGE_REACTION_REMOVE_EMOJI',
];

module.exports = (client, packet) => {
	const { t: eventName, d: data } = packet;
	if (!data || !client.ready) return undefined;

	if (eventName === 'USER_UPDATE') {
		return client.emit('userUpdateRaw', {
			...data,
		});
	}

	if (!events.includes(eventName)) return undefined;

	const guild = client.guilds.cache.get(data.guild_id);
	if (!data.guild_id || !guild || !guild.available) return undefined;

	const formatted = `${eventName
		.split('_')
		.map((word, index) => `${index === 0 ? word.toLowerCase() : capitaliseFirstLetter(word.toLowerCase())}`)
		.join('')}Raw`;

	return client.emit(formatted, {
		...data,
	});
};
