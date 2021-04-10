export default async (client, data) => {
	const star = await client.db.models.Star.findByPk(data.message_id);
	if (!star) return;

	client.guilds.cache.get(data.guild_id).starboard.destroyStar(star);
};
