'use strict';

const moment = require('moment');
const { capitaliseFirstLetter: cfl, pluralize, matchChannels } = require('../../util/Util.js');
const StarbotCommand = require('../../structures/StarbotCommand.js');

module.exports = class ChannelInfo extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'channelinfo',
			description: 'get information about a channel',
			group: 'info',
			usage: '<channel>',
			args: [{
				name: '<channel>',
				optional: true,
				description: 'a channel mention or ID',
				example: `<#${client.snowflake()}>`,
				code: false,
			}],
			aliases: ['infochannel'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	run(message) {
		const { client, args, channel, guild } = message;
		const infoChannel = guild.channels.cache.get(!args[0] ? channel.id : matchChannels(args[0])[0]);

		if (!infoChannel) {
			return channel.embed('Please provide a valid channel resolvable!');
		}

		const channelName = `${['text', 'news'].includes(infoChannel.type) ? '#' : ''}${infoChannel.name}`;
		const embed = client.embed()
			.setAuthor(guild.name, guild.iconURL(), `https://discord.com/channels/${guild.id}/${infoChannel.id}`)
			.setThumbnail(guild.iconURL())
			.setTimestamp()
			.setTitle(`${channelName} information`)
			.addField('Name', infoChannel.name, true)
			.addField('ID', infoChannel.id, true)
			.addField('Type', cfl(infoChannel.type), true)
			.addField('Created at', moment(infoChannel.createdAt).format('dddd, MMMM Do YYYY, h:mm:ss a'), true);

		if (['text', 'news'].includes(infoChannel.type)) {
			embed.addField('Category', infoChannel.parent ? infoChannel.parent.name : 'None', true)
				.addField('Topic', infoChannel.topic || 'None', true)
				.addField('Rate limit', moment.utc(infoChannel.rateLimitPerUser).format('H[h] mm[m] ss[s]'), true)
				.addField('NSFW', infoChannel.nsfw ? 'Yes' : 'No', true);
		} else if (infoChannel.type === 'voice') {
			const text = infoChannel.userLimit === 0 ?
				'Unlimited users' :
				`${infoChannel.userLimit} user${pluralize(infoChannel.userLimit)}`;

			embed.addField('Bitrate', `${infoChannel.bitrate}bits`, true)
				.addField('User limit', text, true)
				.addField('Current users', `${infoChannel.members.size} user${pluralize(infoChannel.members.size)}`, true);
		} else if (infoChannel.type === 'category') {
			const count = infoChannel.children ? infoChannel.children.size : 0;

			embed.addField('Children', `${count} channel${pluralize(count)}`, true);
		}

		return channel.send(embed);
	}
};
