'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { pluralize: s } = require('../../util/util.js');

class TagList extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'taglist',
			description: 'lists all the tags a server has',
			group: 'tag',
			usage: '',
			args: [],
			aliases: ['tagslist'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	run(message) {
		const { client, channel, guild } = message;
		const tags = guild.tags;

		const tagEmbed = client.embed(`${guild.name} has ${tags.size} tag${s(tags.size)} in total.`, true)
			.setTitle(`${guild.name} tags`);

		tags.forEach(tag => {
			tagEmbed.addField(tag.name, `Created by <@!${tag.creator_id}>`, true);
		});

		return channel.embed(tagEmbed);
	}
}

module.exports = TagList;
