'use strict';

const moment = require('moment');
const logger = require('../util/logger.js');
const { fancyJoin, prettifyPermissions } = require('../util/util.js');

module.exports = async (client, message) => {
	const { guild, channel, author } = message;

	if (message.system || (message.guild && !message.guild.available) || !client.ready) return null;

	if (guild) {
		await guild.cacheClient();
		await guild.add();

		if (!channel.clientHasPermissions()) return null;
	}

	await author.add();

	if (message.author.bot) return null;

	message.parse();

	if (message.ignored && !client.isOwner(author.id)) return null;

	if (!message.DM && message.tag) {
		try {
			await message.sendTag();
		} catch (err) {
			channel.error(err, 'sendTag');
		}
		return null;
	}

	if (!message.command) return null;

	if (message.DM && message.command.guildOnly) {
		return channel.embed('This command can only be used in a server!');
	}

	let permissions = message.missingAuthorPermissions;

	if (permissions.length && !client.isOwner(author.id)) {
		permissions = fancyJoin(prettifyPermissions(permissions));

		return channel.embed(`You need the following permissions to run this command: ${permissions}`);
	}

	if (message.command.ownerOnly && !client.isOwner(author.id)) {
		return channel.embed('This is an owner-only command!');
	}

	let timeLeft = message.command.checkThrottle(message);

	if (timeLeft) {
		timeLeft = moment(timeLeft).fromNow(true);

		return channel.embed(`You are sending commands too fast! Please wait ${timeLeft} to use this command again.`);
	}

	if (message.command.clientPermissions.length) {
		try {
			let canRun = await channel.clientHasPermissions(message.command.clientPermissions);

			if (!canRun) {
				canRun = fancyJoin(prettifyPermissions(canRun));

				return channel.embed(`The bot needs the following permissions to run this command: ${canRun}`);
			}
		} catch (err) {
			return channel.err(err, 'checkClientPermissions');
		}
	}

	message.command.throttle(message);

	try {
		message.command.run(message);
	} catch (err) {
		channel.awaiting.delete(author.id);
		channel.error(err, 'runCommand');

		logger.err(err, 'Failed to run command');
	} finally {
		return null;
	}
};
