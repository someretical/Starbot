'use strict';

module.exports = async (client, data, guild, channel) => {
	const star = client.db.models.Star.cache.get(data.id);
	const _guild = guild.model;
	const starboard = guild.channels.cache.get(_guild.starboard_id);
	if (!star || !_guild.starboardEnabled || !starboard || starboard.type !== 'text') return undefined;

	let author;
	try {
		author = await client.users.fetch(data.author.id);
		// eslint-disable-next-line no-empty
	} catch (err) {}
	if (!author) return undefined;
	await author.findCreateFind();
	if (author.ignored) return undefined;

	let msg;
	try {
		msg = await channel.messages.fetch(data.id);
		// eslint-disable-next-line no-empty
	} catch (err) {}
	if (!msg || (!msg.content && !msg.embeds.length)) return undefined;

	return client.db.models.Star.q.add(msg.id, () => guild.starboard._displayStar(msg, star));
};
