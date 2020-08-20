'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');

class TagList extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'taglist',
			description: 'lists all the tags a server has',
			group: 'tag',
			usage: '<page>',
			args: [{
				name: '<page>',
				optional: true,
				description: 'page of tags to display, defaults to 1',
				example: '2',
				code: true,
			}],
			aliases: ['tagslist'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	run(message) {
		const { client, channel, guild, args } = message;
		const tags = guild.tags;
		const page = parseInt(args[0]) || 1;

		if (Number.isNaN(page) || !Number.isSafeInteger(page) || page < 1) {
			return channel.embed('Please provide a valid page!');
		}


		const paged = Array.from(tags.values()).slice((page - 1) * 12, page * 12);
		const start = ((page - 1) * 12) + 1;
		const end = page * 12 > tags.length ? tags.length : page * 12;

		const embed = client.embed(null, true)
			.setTitle(`${guild.name} tags`)
			.setDescription(`Showing tags ${start} to ${end} of ${tags.length}`);

		paged.forEach(tag => embed.addField(tag.name, `Created by <@${tag.creator_id}>`, true));

		return channel.send(embed);
	}
}

module.exports = TagList;
