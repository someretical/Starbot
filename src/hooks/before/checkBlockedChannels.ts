export default message => {
	if (!message.guild || message.client.isOwner(message.author.id)) return false;

	return message.guild.data.blocked.channels.includes(message.channel.id);
};
