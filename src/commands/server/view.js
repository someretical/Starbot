'use strict';

const { stripIndents } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { pluralize } = require('../../util/Util.js');

module.exports = class View extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'view',
			description: 'lists blocked users/roles/channels',
			group: 'server',
			usage: '<option> <page>',
			args: [{
				name: '<option>',
				optional: false,
				description: 'one of the following: users, roles, channels',
				example: 'users',
			}, {
				name: '<page>',
				optional: true,
				description: 'a valid integer larger than 0',
				defaultValue: '1',
				example: '1',
			}],
			aliases: ['list'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	run(message) {
		const { client, args, channel, guild } = message;

		if (!args[0]) {
			return channel.send('Please provide an option!');
		}

		const option = (args[0].match(/^(users|roles|channels)$/i) || [])[1];
		if (!option) {
			return channel.send('Please provide a valid option!');
		}

		const page = args[1] ? parseInt(args[1]) : 1;
		if (page) {
			if (Number.isNaN(page) || !Number.isSafeInteger(page) || page < 1) {
				return channel.send('Please provide a valid page!');
			}
		}

		const { ignoredUsers: users, ignoredRoles: roles, ignoredChannels: channels } = guild.model;
		let embed;

		if (option === 'users') {
			if (!users.length) {
				return channel.send('There are no blocked users.');
			}

			const max = Math.ceil(users.length / 50);
			if (page > max) {
				return channel.send(max === 1 ? 'There is only one page.' : `Please provide a page between 1 and ${max}.`);
			}

			const paged = users.slice((page - 1) * 50, page * 50).map(id => `<@${id}>`);
			const start = ((page - 1) * 50) + 1;
			const end = Math.min(start + 49, users.length);
			embed = client.embed(null, true)
				.setTitle(`${guild.name} blocked users`)
				.setDescription(stripIndents`
					Showing ${start} to ${end} of ${users.length} user${pluralize(users.length)}

					${paged.join(' | ')}
				`);
		} else if (option === 'roles') {
			if (!roles.length) {
				return channel.send('There are no blocked roles.');
			}

			const max = Math.ceil(roles.length / 50);
			if (page > max) {
				return channel.send(max === 1 ? 'There is only one page.' : `Please provide a page between 1 and ${max}.`);
			}

			const paged = roles.slice((page - 1) * 50, page * 50).map(id =>
				guild.roles.cache.has(id) ? `<@&${id}>` : `\`${id} - deleted\``,
			);
			const start = ((page - 1) * 50) + 1;
			const end = Math.min(start + 49, roles.length);
			embed = client.embed(null, true)
				.setTitle(`${guild.name} blocked roles`)
				.setDescription(stripIndents`
					Showing ${start} to ${end} of ${roles.length} role${pluralize(roles.length)}

					${paged.join(' | ')}
				`);
		} else {
			if (!channels.length) {
				return channel.send('There are no blocked channels.');
			}

			const max = Math.ceil(channels.length / 50);
			if (page > max) {
				return channel.send(max === 1 ? 'There is only one page.' : `Please provide a page between 1 and ${max}.`);
			}

			const paged = channels.slice((page - 1) * 50, page * 50).map(id =>
				guild.channels.cache.has(id) ? `<#${id}>` : `\`${id} - deleted\``,
			);
			const start = ((page - 1) * 50) + 1;
			const end = Math.min(start + 49, channels.length);
			embed = client.embed(null, true)
				.setTitle(`${guild.name} blocked channels`)
				.setDescription(stripIndents`
					Showing ${start} to ${end} of ${channels.length} channel${pluralize(channels.length)}

					${paged.join(' | ')}
				`);
		}

		return channel.send(embed);
	}
};
