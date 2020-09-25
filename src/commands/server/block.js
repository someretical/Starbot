'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { fancyJoin, matchUsers, matchRoles, matchChannels, pluralize } = require('../../util/Util.js');

module.exports = class Block extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'block',
			description: 'block users, roles or channels',
			group: 'server',
			usage: '<option> <value> <value2> ...',
			args: [{
				name: '<option>',
				optional: false,
				description: 'one of the following: user, role, channel',
				example: 'user',
			}, {
				name: 'user <value>',
				optional: false,
				description: 'an unblocked user mention or ID',
				example: `<@${client.owners[0]}>`,
				code: false,
			}, {
				name: 'role <value>',
				optional: false,
				description: 'an unblocked role mention or ID',
				example: `<@&${client.owners[0]}>`,
				code: false,
			}, {
				name: 'channel <value>',
				optional: false,
				description: 'an unblocked channel mention or ID',
				example: `<#${client.owners[0]}>`,
				code: false,
			}],
			aliases: [],
			userPermissions: ['MANAGE_GUILD'],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { client, args, channel, guild } = message;

		if (!args[0]) {
			return channel.send('Please provide an option!');
		}

		const option = (args[0].match(/^(user|role|channel)$/i) || [])[1];
		if (!option) {
			return channel.send('Please provide a valid setting!');
		}

		if (!args[1]) {
			return channel.send('Please provide a new value for the setting!');
		}

		const values = args.slice(1).join(' ');
		const _guild = guild.model;
		let res;

		if (option === 'user') {
			const users = matchUsers(values);
			if (!users.length) {
				return channel.send('Please provide at least 1 valid user resolvable!');
			}

			if (users.some(id => !client.users.cache.has(id))) {
				return channel.send('One (or more) of the provided users could not be found.');
			}

			if (users.some(id => !_guild.ignoredUsers.includes(id))) {
				return channel.send('One (or more) of the provided users are already blocked.');
			}

			await client.db.models.Guild.q.add(guild.id, () =>
				_guild.update({ ignoredUsers: _guild.ignoredUsers.concat(users) }),
			);

			res = users.length === 1 ?
				client.embed(`<@${users[0]}> has been blocked.`) :
				users.length < 11 ?
					client.embed(`The following users were blocked: ${fancyJoin(users.map(id => `<@${id}>`))}`) :
					`${users.length} user${pluralize(users.length)} were blocked.`;
		} else if (option === 'role') {
			const roles = matchRoles(values);
			if (!roles.length) {
				return channel.send('Please provide at least 1 valid role resolvable!');
			}

			if (roles.some(id => !guild.roles.cache.has(id))) {
				return channel.send('One (or more) of the provided roles could not be found.');
			}

			if (roles.some(id => !_guild.ignoredRoles.includes(id))) {
				return channel.send('One (or more) of the provided roles are already blocked.');
			}

			await client.db.models.Guild.q.add(guild.id, () =>
				_guild.update({ ignoredRoles: _guild.ignoredRoles.concat(roles) }),
			);

			res = roles.length === 1 ?
				client.embed(`The <@&${roles[0]}> role has been blocked.`) :
				roles.length < 11 ?
					client.embed(`The following roles were blocked: ${fancyJoin(roles.map(id => `<@&${id}>`))}`) :
					`${roles.length} roles${pluralize(roles.length)} were blocked.`;
		} else {
			const channels = matchChannels(values);
			if (!channels.length) {
				return channel.send('Please provide at least 1 valid channel resolvable!');
			}

			if (channels.some(id => !guild.channels.cache.has(id))) {
				return channel.send('One (or more) of the provided channels could not be found.');
			}

			if (channels.some(id => ['text', 'news'].includes(guild.channels.cache.get(id).type))) {
				return channel.send('One (or more) of the provided channels were not text channels.');
			}

			if (channels.some(id => !_guild.ignoredChannels.includes(id))) {
				return channel.send('One (or more) of the provided channels are already blocked.');
			}

			await client.db.models.Guild.q.add(guild.id, () =>
				_guild.update({ ignoredChannels: _guild.ignoredChannels.concat(channels) }),
			);

			res = channels.length === 1 ?
				`The <#${channels[0]}> channel has been blocked.` :
				channels.length < 11 ?
					`The following channels were blocked: ${fancyJoin(channels.map(id => `<#${id}>`))}` :
					`${channels.length} channels${pluralize(channels.length)} were blocked.`;
		}

		return channel.send(res);
	}
};
