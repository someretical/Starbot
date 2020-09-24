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

		if (option === 'user') {
			const users = matchUsers(values);
			if (!users.length) {
				return channel.send('Please provide at least 1 valid user resolvable!');
			}

			const filteredUsers = users.filter(id => client.users.cache.has(id));
			if (users.length !== filteredUsers.length) {
				return channel.send('One (or more) of the provided users could not be found.');
			}

			const _guild = await guild.findCreateFind();
			const filteredUsers2 = filteredUsers.filter(id => !_guild.ignoredUsers.includes(id));
			if (filteredUsers.length !== filteredUsers2.length) {
				return channel.send('One (or more) of the provided users are already blocked.');
			}

			await client.db.models.Guild.q.add(guild.id, () =>
				_guild.update({ ignoredUsers: _guild.ignoredUsers.concat(filteredUsers2) }),
			);

			const res = filteredUsers2.length === 1 ?
				client.embed(`<@${filteredUsers2[0]}> has been blocked.`) :
				filteredUsers2.length < 11 ?
					client.embed(`The following users were blocked: ${fancyJoin(filteredUsers2.map(id => `<@${id}>`))}`) :
					`${filteredUsers2.length} user${pluralize(filteredUsers2.length)} were blocked.`;

			return channel.send(res);
		} else if (option === 'role') {
			const roles = matchRoles(values);
			if (!roles.length) {
				return channel.send('Please provide at least 1 valid role resolvable!');
			}

			const filteredRoles = roles.filter(id => guild.roles.cache.has(id));
			if (roles.length !== filteredRoles.length) {
				return channel.send('One (or more) of the provided roles could not be found.');
			}

			const _guild = await guild.findCreateFind();
			const filteredRoles2 = filteredRoles.filter(id => !_guild.ignoredRoles.includes(id));
			if (filteredRoles.length !== filteredRoles2.length) {
				return channel.send('One (or more) of the provided roles are already blocked.');
			}

			await client.db.models.Guild.q.add(guild.id, () =>
				_guild.update({ ignoredRoles: _guild.ignoredRoles.concat(filteredRoles2) }),
			);

			const res = filteredRoles2.length === 1 ?
				client.embed(`The <@&${filteredRoles2[0]}> role has been blocked.`) :
				filteredRoles2.length < 11 ?
					client.embed(`The following roles were blocked: ${fancyJoin(filteredRoles2.map(id => `<@&${id}>`))}`) :
					`${filteredRoles2.length} roles${pluralize(filteredRoles2.length)} were blocked.`;

			return channel.send(res);
		} else {
			const channels = matchChannels(values);
			if (!channels.length) {
				return channel.send('Please provide at least 1 valid channel resolvable!');
			}

			const filteredChannels = channels.filter(id => guild.channels.cache.has(id));
			if (channels.length !== filteredChannels.length) {
				return channel.send('One (or more) of the provided channels could not be found.');
			}

			if (filteredChannels.some(id => ['text', 'news'].includes(guild.channels.cache.get(id).type))) {
				return channel.send('One (or more) of the provided channels were not text channels.');
			}

			const _guild = await guild.findCreateFind();
			const filteredChannels2 = filteredChannels.filter(id => !_guild.ignoredChannels.includes(id));
			if (filteredChannels.length !== filteredChannels2.length) {
				return channel.send('One (or more) of the provided channels are already blocked.');
			}

			await client.db.models.Guild.q.add(guild.id, () =>
				_guild.update({ ignoredChannels: _guild.ignoredChannels.concat(filteredChannels2) }),
			);

			const res = filteredChannels2.length === 1 ?
				`The <#${filteredChannels2[0]}> channel has been blocked.` :
				filteredChannels2.length < 11 ?
					client.embed(`The following channels were blocked: ${fancyJoin(filteredChannels2.map(id => `<#${id}>`))}`) :
					`${filteredChannels2.length} channels${pluralize(filteredChannels2.length)} were blocked.`;

			return channel.send(res);
		}
	}
};
