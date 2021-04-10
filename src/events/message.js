'use strict';

const Logger = require('../util/Logger.js');

module.exports = async (client, message) => {
	const { author, guild } = message;

	if (
		!client._ready
		|| author.bot
		|| message.system
		|| message.webhookID
	) return;

	if (guild && !guild.available) return;

	if (guild) {
		await guild.findCreateFind();
		await guild.cacheClient();

		if (!message.channel.permissionsFor(message.guild.me).has(client.permissions)) return;
	}

	message.parseContent();

	if (!message.command) return;

	if (message.command.run) {
		try {
			if (await message.command.runBeforeHooks(message)) return;

			await message.command.run(message);
			message.command.runAfterHooks(message);
		} catch (err) {
			Logger.err('Failed to run command');
			Logger.stack(err);
		}
	} else {
		try {
			message.guild.tags.getSendUpdate(message);
		} catch (err) {
			Logger.err('Failed to run tag');
			Logger.stack(err);
		}
	}
};
