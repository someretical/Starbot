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

		if (option === 'user') {
			const users = matchUsers(values);
			if (!users.length) {
				return channel.send('Please provide at least 1 valid user resolvable!');
			}

			const _guild = await guild.findCreateFind();
			const filteredUsers = users.filter(id => _guild.ignoredUsers.includes(id));
			if (users.length !== filteredUsers.length) {
				return channel.send('One (or more) of the provided users are not blocked.');
			}

			await client.db.models.Guild.q.add(guild.id, () =>
				_guild.update({ ignoredUsers: _guild.ignoredUsers.filter(id => !users.includes(id)) }),
			);

			const res = filteredUsers.length === 1 ?
				client.embed(`<@${filteredUsers[0]}> has been unblocked.`) :
				filteredUsers.length < 11 ?
					client.embed(`The following users were unblocked: ${fancyJoin(filteredUsers.map(id => `<@${id}>`))}`) :
					`${filteredUsers.length} user${pluralize(filteredUsers.length)} were unblocked.`;

			return channel.send(res);
		} else if (option === 'role') {
			const roles = matchRoles(values);
			if (!roles.length) {
				return channel.send('Please provide at least 1 valid role resolvable!');
			}

			const _guild = await guild.findCreateFind();
			const filteredRoles = roles.filter(id => _guild.ignoredRoles.includes(id));
			if (roles.length !== filteredRoles.length) {
				return channel.send('One (or more) of the provided roles are not blocked.');
			}

			await client.db.models.Guild.q.add(guild.id, () =>
				_guild.update({ ignoredRoles: _guild.ignoredRoles.filter(id => !filteredRoles.includes(id)) }),
			);

			const res = filteredRoles.length === 1 ?
				client.embed(`The <@&${filteredRoles[0]}> role has been unblocked.`) :
				filteredRoles.length < 11 ?
					client.embed(`The following roles were unblocked: ${fancyJoin(filteredRoles.map(id => `<@&${id}>`))}`) :
					`${filteredRoles.length} roles${pluralize(filteredRoles.length)} were unblocked.`;

			return channel.send(res);
		} else {
			const channels = matchChannels(values);
			if (!channels.length) {
				return channel.send('Please provide at least 1 valid channel resolvable!');
			}

			const _guild = await guild.findCreateFind();
			const filteredChannels = channels.filter(id => _guild.ignoredChannels.includes(id));
			if (channels.length !== filteredChannels.length) {
				return channel.send('One (or more) of the provided channels are not blocked.');
			}

			await client.db.models.Guild.q.add(guild.id, () =>
				_guild.update({ ignoredChannels: _guild.ignoredChannels.filter(id => !filteredChannels.includes(id)) }),
			);

			const res = filteredChannels.length === 1 ?
				`The <#${filteredChannels[0]}> channel has been unblocked.` :
				filteredChannels.length < 11 ?
					`The following channels were unblocked: ${fancyJoin(filteredChannels.map(id => `<#${id}>`))}` :
					`${filteredChannels.length} channels${pluralize(filteredChannels.length)} were unblocked.`;

			return channel.send(res);
		}
	}
};
