'use strict';

module.exports = async (client, data) => {
	const channel = client.channels.cache.get(data.channel_id);
	const { starboard } = client.guilds.cache.get(data.guild_id);

	await starboard.guild.add();

	if (!channel || channel.ignored) return;

	data.ids.map(async id => {
		const star = await starboard.getStarModel(id);
		if (star) await starboard.destroyStar(star);
	});
};
