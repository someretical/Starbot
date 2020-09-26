'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { fancyJoin, matchUsers, matchRoles, matchChannels, pluralize } = require('../../util/Util.js');

module.exports = class Unblock extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'unblock',
			description: 'unblock users, roles or channels',
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
				description: 'a blocked user mention or ID',
				example: `<@${client.owners[0]}>`,
				code: false,
			}, {
				name: 'role <value>',
				optional: false,
				description: 'a blocked role mention or ID',
				example: `<@&${client.owners[0]}>`,
				code: false,
			}, {
				name: 'channel <value>',
				optional: false,
				description: 'a blocked channel mention or ID',
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

			if (users.some(id => !_guild.blockedUsers.includes(id))) {
				return channel.send('One (or more) of the provided users are not blocked.');
			}

			await client.db.models.Guild.q.add(guild.id, () =>
				_guild.update({ blockedUsers: _guild.blockedUsers.filter(id => !users.includes(id)) }),
			);

			res = users.length === 1 ?
				client.embed(`<@${users[0]}> has been unblocked.`) :
				users.length < 11 ?
					client.embed(`The following users were unblocked: ${fancyJoin(users.map(id => `<@${id}>`))}`) :
					`${users.length} user${pluralize(users.length)} were unblocked.`;
		} else if (option === 'role') {
			const roles = matchRoles(values);
			if (!roles.length) {
				return channel.send('Please provide at least 1 valid role resolvable!');
			}

			if (roles.some(id => !_guild.blockedRoles.includes(id))) {
				return channel.send('One (or more) of the provided roles are not blocked.');
			}

			await client.db.models.Guild.q.add(guild.id, () =>
				_guild.update({ blockedRoles: _guild.blockedRoles.filter(id => !roles.includes(id)) }),
			);

			res = roles.length === 1 ?
				client.embed(`The <@&${roles[0]}> role has been unblocked.`) :
				roles.length < 11 ?
					client.embed(`The following roles were unblocked: ${fancyJoin(roles.map(id => `<@&${id}>`))}`) :
					`${roles.length} roles${pluralize(roles.length)} were unblocked.`;
		} else {
			const channels = matchChannels(values);
			if (!channels.length) {
				return channel.send('Please provide at least 1 valid channel resolvable!');
			}

			if (channels.some(id => !_guild.blockedChannels.includes(id))) {
				return channel.send('One (or more) of the provided channels are not blocked.');
			}

			await client.db.models.Guild.q.add(guild.id, () =>
				_guild.update({ blockedChannels: _guild.blockedChannels.filter(id => !channels.includes(id)) }),
			);

			res = channels.length === 1 ?
				`The <#${channels[0]}> channel has been unblocked.` :
				channels.length < 11 ?
					`The following channels were unblocked: ${fancyJoin(channels.map(id => `<#${id}>`))}` :
					`${channels.length} channels${pluralize(channels.length)} were unblocked.`;
		}

		return channel.send(res);
	}
};
