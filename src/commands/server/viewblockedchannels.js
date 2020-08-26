'use strict';

const { stripIndents } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');

module.exports = class ViewBlockedChannels extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'viewblockedchannels',
			description: 'lists all the ignored channels on a server',
			group: 'server',
			usage: '<page>',
			args: [{
				name: '<page>',
				optional: true,
				description: 'page of blocked channels to display, defaults to 1',
				example: '2',
				code: true,
			}],
			aliases: ['viewchannels'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	run(message) {
		const { client, args, channel, guild } = message;
		const channels = JSON.parse(guild.settings.ignoredChannels);
		const page = parseInt(args[0]) || 1;

		if (Number.isNaN(page) || !Number.isSafeInteger(page) || page < 1) {
			return channel.embed('Please provide a valid page!');
		}

		if (page > Math.ceil(channels.size / 12)) {
			return channel.embed('The page number you provided is too large.');
		}

		const paged = Array.from(channels.values()).slice((page - 1) * 50, page * 50);
		const start = ((page - 1) * 50) + 1;
		const end = page * 50 > channels.length ? channels.length : page * 50;

		const embed = client.embed(null, true)
			.setTitle(`${guild.name} ignored channels`)
			.setDescription(stripIndents`
				Showing channels ${start} to ${end} of ${channels.length}
				${paged.map(id => `<#${id}>`).join(' | ')}
			`);

		return channel.send(embed);
	}
};
