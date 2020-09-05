'use strict';

module.exports = async (client, data, guild, channel) => {
	let msg;
	try {
		msg = await channel.messages.fetch(data.message_id);
		// eslint-disable-next-line no-empty
	} catch (err) {}
	if (!msg) return;

	guild.starboard.fixStar(msg);
};
