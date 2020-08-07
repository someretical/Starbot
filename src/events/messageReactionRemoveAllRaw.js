'use strict';

module.exports = async (client, data) => {
	const channel = client.channels.cache.get(data.channel_id);
	const { starboard } = client.guilds.cache.get(data.guild_id);

	if (!channel) return;

	await starboard.guild.add();

	if (channel.ignored) return;

	const star = await starboard.getStarModel(data.message_id);
	if (star) await starboard.fixStar(star);
};
