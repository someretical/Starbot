'use strict';

module.exports = async (client, data) => {
	const channel = client.channels.cache.get(data.channel_id);
	const guild = client.guilds.cache.get(data.guild_id);

	if (!channel || data.emoji.name !== '⭐') return;

	await guild.add();

	if (client.db.cache.GlobalIgnore.has(data.user_id) ||
		guild.ignores.has(data.user_id + guild.id) ||
		channel.ignored
	) return;

	const message = await channel.messages.fetch(data.message_id);
	if (!message) return;

	await message.author.add();
	if (message.author.id === data.user_id) return;

	if (message) await guild.starboard.removeStar(message, data.user_id);
};
