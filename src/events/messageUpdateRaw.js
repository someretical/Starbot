'use strict';

module.exports = async (client, data) => {
	const author = client.users.cache.get(data.author_id);
	const channel = client.channels.cache.get(data.channel_id);

	if (!author || !channel) return null;

	await author.add();
	await channel.guild.add();

	if (channel.ignored || !channel.guild.settings.starboardEnabled) return null;

	const message = await channel.messages.fetch(data.id);
	if (!message) return null;

	const { botMessage_id } = await message.guild.starboard.getStarModel(message.id);
	if (!botMessage_id) return null;

	const starboardChannel = message.guild.starboard.channel;
	if (!starboardChannel) return null;

	const botMessage = await starboardChannel.messages.cache.get(botMessage_id);
	if (!botMessage || !botMessage.embeds.length) return null;

	const field = botMessage.embeds[0].fields.find(f => f.name === 'Content');
	let content = message.embeds[0] ? message.embeds[0].description : message.content;

	if (content && content.length > 1021) content = `${content.substring(0, 1021)}...`;
	if (field && content && field.value === content) return null;

	return botMessage.edit(botMessage.embeds[0].spliceFields(1, 1, {
		name: 'Content',
		value: content,
		inline: true,
	}));
};
