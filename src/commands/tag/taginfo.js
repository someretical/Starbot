'use strict';

const moment = require('moment');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { pluralize } = require('../../util/Util.js');

module.exports = class TagInfo extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'taginfo',
			description: 'view the statistics of a tag',
			group: 'tag',
			usage: '<tag>',
			args: [{
				name: '<tag>',
				optional: false,
				description: 'the name of the tag',
				example: 'hi',
			}],
			aliases: ['tagstats', 'tagstatistics', 'taginformation'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	run(message) {
		const { client, args, author, channel, guild } = message;

		if (!args[0]) {
			return channel.send('Please provide a tag name!');
		}

		const tag = guild.tags.find(t => t.name === args[0].toLowerCase());
		if (!tag) {
			return channel.send('That tag does not exist!');
		}

		const creator = client.users.cache.has(tag.creator_id) ?
			`<@${tag.creator_id}>` :
			`Unknown user (${tag.creator_id})`;
		const preview = tag.response
			.replace(/<guild>/ig, guild.name)
			.replace(/<channel>/ig, channel.toString())
			.replace(/<author>/ig, author.toString());
		const embed = client.embed(null, true)
			.setTitle('Tag information')
			.setThumbnail(guild.iconURL())
			.addField('Name', tag.name, true)
			.addField('Creator', creator, true)
			.addField('Created on', moment(tag.createdAt).format('Do MMM YYYY'), true);

		if (tag.updatedAt && tag.lastContentUpdate.getTime() !== tag.createdAt.getTime()) {
			embed.addField('Last updated at', moment(tag.updatedAt).format('Do MMM YYYY'), true);
		}

		embed.addField('Uses', `${tag.uses} use${pluralize(tag.uses)}`, true);

		for (let i = 0; i < (embed.fields.length % 3); i++) embed.addField('\u200b', '\u200b', true);

		embed.addField('Response', preview.length > 1024 ? `${preview.substring(0, 1021)}...` : preview);

		return channel.send(embed);
	}
};
