'use strict';

const { oneLine, stripIndents } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { pluralize } = require('../../util/Util.js');

module.exports = class TagList extends StarbotCommand {
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
				defaultValue: '1',
				example: '2',
			}],
			aliases: ['listags'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	run(message) {
		const { client, args, channel, guild } = message;

		const page = parseInt(args[0] || 1);
		if (page) {
			if (Number.isNaN(page) || !Number.isSafeInteger(page) || page < 1) {
				return channel.send('Please provide a valid page!');
			}
		}

		const tags = guild.tags;
		if (!tags.size) {
			return channel.send('There are no tags.');
		}

		const max = Math.ceil(tags.size / 15);
		if (page > max) {
			return channel.send(max === 1 ? 'There is only one page.' : `Please provide a page between 1 and ${max}.`);
		}

		// Using Array.from(stars.values()).slice() here instead of stars.filter(byIndex)
		// because collection indexes are keys, not the actual index
		const paged = Array.from(tags.values())
			.slice((page - 1) * 15, page * 15)
			.sort((a, b) => a.uses - b.uses)
			.map(tag => oneLine`
				• ${tag.name} - 
				created by ${client.users.cache.has(tag.author_id) ? `<@${tag.author_id}>` : `Unknown user (${tag.author_id})`}
				 - ${tag.uses} use${pluralize(tag.uses)}
			`);
		const start = ((page - 1) * 50) + 1;
		const end = Math.min(start + 49, tags.size);
		const embed = client.embed(null, true)
			.setTitle(`${guild.name} tags`)
			.setDescription(stripIndents`
				Showing ${start} to ${end} of ${tags.size} tag${pluralize(tags.size)}

				${paged.join('\n')}
			`);

		return channel.send(embed);
	}
};
