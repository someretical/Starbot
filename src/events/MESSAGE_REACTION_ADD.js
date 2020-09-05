'use strict';

module.exports = async (client, data, guild, channel) => {
	let msg;
	try {
		msg = await channel.messages.fetch(data.message_id);
		// eslint-disable-next-line no-empty
	} catch (err) {}
	if (!msg) return;

	await msg.author.findCreateFind();
	guild.starboard.addStar(msg, data.user_id);
};
