'use strict';

const { RAW_EVENTS, STAR_EMOJI } = require('../util/Constants.js');

module.exports = async (client, { t: event, d: data }) => {
	if (
		!client._ready
		|| !RAW_EVENTS.includes(event)
		|| !data
		|| data.webhook_id
	) return;

	const guild = await client.guilds.fetch(data.guild_id);
	if (
		!guild
		|| !guild.available
	) return;

	/*
	 * MESSAGE_UPDATE: id, channel_id, guild_id, author.id OR webhook_id // NOT GOING TO DO
	 * MESSAGE_DELETE: id, channel_id, guild_id
	 * MESSAGE_DELETE_BULK: ids, channel_id, guild_id // LMAO NOT GOING TO DO
	 * MESSAGE_REACTION_ADD: user_id, channel_id, message_id, guild_id, member, emoji
	 * MESSAGE_REACTION_REMOVE: user_id, channel_id, guild_id, message_id, emoji
	 * MESSAGE_REACTION_REMOVE_ALL: channel_id, message_id, guild_id
	 * MESSAGE_REACTION_REMOVE_EMOJI: channel_id, guild_id, message_id, emoji
	 */

	await guild.findCreateFind();
	await guild.cacheClient();

	const channel = guild.channels.cache.get(data.channel_id);
	if (
		!channel
		|| guild.data.blocked.channels.includes(data.channel_id)
	) return;

	if (data.emoji) {
		const compareEmoji = guild.data.starboard.emoji || STAR_EMOJI;
		const actualEmoji = data.emoji.id || data.emoji.name;

		if (compareEmoji !== actualEmoji) return;
	}

	if (data.user_id) {
		const user = await client.users.fetch(data.user_id);

		await user.findCreateFind();

		if (
			user.data.blocked.executor
			|| guild.data.blocked.users.includes(user.id)
		) return;
	}

	client.emit(
		event,
		data,
	);
};
