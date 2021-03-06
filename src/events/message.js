'use strict';

const Logger = require('../util/Logger.js');
const { fancyJoin, prettifyPermissions } = require('../util/Util.js');

module.exports = async (client, message) => {
	const { author, channel, guild, member } = message;
	if (!client._ready || message.system || message.webhookID || (guild && !guild.available)) return undefined;

	await author.findCreateFind();
	let _guild;
	if (guild) {
		await guild.cacheClient();
		_guild = await guild.findCreateFind();

		if (!channel.clientHasPermissions()) return undefined;
	}

	if (author.bot || channel.awaiting.has(author.id)) return undefined;
	if (!client.isOwner(author.id)) {
		if (author.blocked || channel.blocked) return undefined;

		if (guild && author.id !== guild.ownerID) {
			if (_guild.blockedUsers.includes(author.id)) return undefined;
			if (_guild.blockedRoles.some(id => member.roles.cache.has(id))) return undefined;
		}
	}

	message.parse();
	if (!message.command) return undefined;

	if (message.DM && message.command.guildOnly) {
		return channel.send('This command can only be used in a server!');
	}

	let permissions = message.missingAuthorPermissions;
	if (permissions.length && !client.isOwner(author.id)) {
		permissions = fancyJoin(prettifyPermissions(permissions));

		return channel.send(`You need the following permissions to run this command: ${permissions}`);
	}

	if (message.command.ownerOnly && !client.isOwner(author.id)) {
		return channel.send('This is an owner-only command!');
	}

	if (await message.command.checkThrottle(message)) return undefined;

	if (message.command.clientPermissions.length && !message.DM) {
		const canRun = channel.clientHasPermissions(message.command.clientPermissions);
		if (canRun) {
			const _permissions = channel.permissionsFor(guild.me);
			const missingPermissions = message.command.clientPermissions.filter(perm => !_permissions.has(perm));
			const formatted = fancyJoin(prettifyPermissions(missingPermissions));

			return channel.send(`The bot needs the following permissions to run this command: ${formatted}`);
		}
	}

	message.command.throttle(message);

	try {
		await message.command.run(message);
	} catch (err) {
		if (channel.awaiting.has(author.id)) channel.awaiting.delete(author.id);
		channel.error(err, 'runCommand');

		Logger.err('Failed to run command');
		Logger.stack(err);
	}

	return undefined;
};
