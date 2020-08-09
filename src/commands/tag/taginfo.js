'use strict';

const { MessageEmbed } = require('discord.js');
const moment = require('moment');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { pluralize: s } = require('../../util/Util.js');

class TagInfo extends StarbotCommand {
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
		const { channel, guild, args } = message;

		if (!args[0]) {
			return channel.embed('Please provide a tag name!');
		}

		const tag = guild.tags.get(guild.id + args[0].toLowerCase());

		if (!tag) {
			return channel.embed('That tag does not exist!');
		}

		const embed = client.embed(null, true)
			.setTitle(`Tag information: ${tag.name}`)
			.setThumbnail(message.guild.iconURL())
			.addField('Name', tag.name, true)
			.addField('Response', tag.response, true)
			.addField('Creator', `<@!${tag.creator_id}>`, true)
			.addField('Created on', moment(tag.createdAt).format('Do MMM YYYY'), true);

		if (tag.updatedAt && tag.lastContentUpdate.getTime() !== tag.createdAt.getTime()) {
			embed.addField('Last updated at', moment(tag.updatedAt).format('Do MMM YYYY'), true);
		}

		embed.addField('Uses', `${tag.uses} use${s(tag.uses)}`, true);

		return channel.send(embed);
	}
}

module.exports = TagInfo;
