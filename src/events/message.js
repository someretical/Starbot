'use strict';

const moment = require('moment');
const logger = require('../util/logger.js');
const { fancyJoin, prettifyPermissions } = require('../util/util.js');

module.exports = async (client, message) => {
	const { guild, channel, author } = message;

	if (message.system || (message.guild && !message.guild.available) || !client.ready) return;

	if (guild) {
		await guild.cacheClient();
		await guild.add();

		if (!channel.clientHasPermissions()) return;
	}

	await author.add();

	if (message.author.bot) return;

	message.parse();

	if (message.ignored && !client.isOwner(author.id)) return;

	if (!message.DM && message.tag) {
		try {
			await message.sendTag();
		} catch (err) {
			channel.error(err, 'sendTag');
		}
		return;
	}

	if (!message.command) return;

	if (message.DM && message.command.guildOnly) {
		channel.embed('This command can only be used in a server!');
		return;
	}

	let permissions = message.missingAuthorPermissions;

	if (permissions.length && !client.isOwner(author.id)) {
		permissions = fancyJoin(prettifyPermissions(permissions));

		channel.embed(`You need the following permissions to run this command: ${permissions}`);
		return;
	}

	if (message.command.ownerOnly && !client.isOwner(author.id)) {
		channel.embed('This is an owner-only command!');
		return;
	}

	let timeLeft = message.command.checkThrottle(message);

	if (timeLeft) {
		timeLeft = moment(timeLeft).fromNow(true);

		channel.embed(`You are sending commands too fast! Please wait ${timeLeft} to use this command again.`);
		return;
	}

	if (message.command.clientPermissions.length) {
		try {
			let canRun = await channel.clientHasPermissions(message.command.clientPermissions);

			if (!canRun) {
				canRun = fancyJoin(prettifyPermissions(canRun));

				channel.embed(`The bot needs the following permissions to run this command: ${canRun}`);
				return;
			}
		} catch (err) {
			channel.err(err, 'checkClientPermissions');
			return;
		}
	}

	message.command.throttle(message);

	try {
		message.command.run(message);
	} catch (err) {
		channel.awaiting.delete(author.id);
		channel.error(err, 'runCommand');

		logger.err(err, 'Failed to run command');
	}
};
