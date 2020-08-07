'use strict';

module.exports = async (client, message) => {
	const channel = client.channels.cache.get(message.channel_id);
	const { starboard } = client.guilds.cache.get(message.guild_id);

	if (!channel) return;

	await starboard.guild.add();

	if (channel.ignored) return;

	const star = await starboard.getStarModel(message.id);
	if (star) await starboard.destroyStar(star);
};
