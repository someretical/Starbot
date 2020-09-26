'use strict';

const EVENTS = [
	'MESSAGE_UPDATE',
	'MESSAGE_DELETE',
	'MESSAGE_DELETE_BULK',
	'MESSAGE_REACTION_ADD',
	'MESSAGE_REACTION_REMOVE',
	'MESSAGE_REACTION_REMOVE_ALL',
	'MESSAGE_REACTION_REMOVE_EMOJI',
];

module.exports = async (client, packet) => {
	const { t: eventName, d: data } = packet;
	if (!data || !client._ready || !EVENTS.includes(eventName)) return undefined;

	const guild = client.guilds.cache.get(data.guild_id);
	const channel = client.channels.cache.get(data.channel_id);
	const emoji = data.emoji;

	if (guild) await guild.findCreateFind();
	if (!guild || !guild.available || !channel || channel.blocked) return undefined;
	if (emoji && emoji.name !== '⭐') return undefined;

	return client.emit(eventName, data, guild, channel);
};
