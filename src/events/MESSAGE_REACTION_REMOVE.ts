export default async (client, data) => {
	const guild = client.guilds.cache.get(data.guild_id);
	const message = await guild.channels.cache
		.get(data.channel_id)
		.messages.fetch(data.message_id);

	if (message.author.id === data.user_id) return;

	guild.starboard.removeStar(message, data.user_id);
};
