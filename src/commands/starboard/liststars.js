'use strict';

const { oneLine, stripIndents } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { getStarEmoji } = require('../../structures/Starboard.js');
const { pluralize } = require('../../util/Util.js');

module.exports = class ListStars extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'liststars',
			description: 'lists all the starred messages a server has',
			group: 'starboard',
			usage: '<page>',
			args: [{
				name: '<page>',
				optional: true,
				description: 'page of stars to display, defaults to 1',
				defaultValue: '1',
				example: '2',
			}],
			aliases: [],
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

		const stars = guild.stars;
		if (!stars.size) {
			return channel.send('There are no starred messages.');
		}

		const max = Math.ceil(stars.size / 15);
		if (page > max) {
			return channel.send(max === 1 ? 'There is only one page.' : `Please provide a page between 1 and ${max}.`);
		}

		// Using Array.from(stars.values()).slice() here instead of stars.filter(byIndex)
		// because collection indexes are keys, not the actual index
		const paged = Array.from(stars.values())
			.slice((page - 1) * 15, page * 15)
			.sort((a, b) => a.uses - b.uses)
			.map((star, index) => oneLine`
				${index + 1}. 
				[Jump to message](https://discord.com/channels/${star.guild_id}/${star.channel_id}/${star.message_id}) by 
				${client.users.cache.has(star.author_id) ? `<@${star.author_id}>` : `Unknown user (${star.author_id})`} - 
				${star.totalStarCount} ${getStarEmoji(star.totalStarCount)}
			`);
		const start = ((page - 1) * 15) + 1;
		const end = Math.min(start + 14, stars.size);
		const embed = client.embed(null, true)
			.setTitle(`${guild.name} stars`)
			.setDescription(stripIndents`
				Showing ${start} to ${end} of ${stars.size} starred message${pluralize(stars.size)}

				${paged.join('\n')}
			`);

		return channel.send(embed);
	}
};
