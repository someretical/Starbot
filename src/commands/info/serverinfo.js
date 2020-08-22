'use strict';

const moment = require('moment');
const { capitaliseFirstLetter: cfl, pluralize } = require('../../util/Util.js');
const StarbotCommand = require('../../structures/StarbotCommand.js');

module.exports = class ServerInfo extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'serverinfo',
			description: 'get information about the server',
			group: 'info',
			usage: '',
			args: [],
			aliases: ['guildinfo', 'infoguild', 'infoserver'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { client, channel, guild } = message;
		const roles = await guild.roles.fetch();
		const channels = guild.channels.cache.size;
		const emojis = guild.emojis.cache.size;
		const boosters = guild.premiumSubscriptionCount;
		const embed = client.embed()
			.setAuthor(guild.name, guild.iconURL(), `https://discord.com/channels/${guild.id}`)
			.setThumbnail(guild.iconURL())
			.setTimestamp()
			.setTitle(`${guild.name} information`)
			.addField('Name', guild.name, true)
			.addField('ID', guild.id, true)
			.addField('Owner', `<@!${guild.ownerID}>`, true)
			.addField('Created at', moment(guild.createdAt).format('dddd, MMMM Do YYYY, h:mm:ss a'), true)
			.addField('Region', cfl(guild.region), true)
			.addField('Members', `${guild.memberCount} member${pluralize(guild.memberCount)}`, true)
			.addField('Boosters', `${boosters} booster${pluralize(boosters)}`, true)
			.addField('Channels', `${channels} channel${pluralize(channels)}`, true)
			.addField('Roles', `${roles.cache.size} role${pluralize(roles.cache.size)}`, true)
			.addField('Custom emojis', `${emojis} emoji${pluralize(emojis)}`, true)
			.addField('Tier', guild.premiumTier === 0 ? 'None' : `Tier ${guild.premiumTier}`, true)
			.addField('AFK timeout', guild.afkTimeout ? moment(guild.afkTimeout).format('mm[m] ss[s]') : 'None', true)
			.addField('Partnered', guild.partnered ? 'Yes' : 'No', true)
			.addField('Verified', guild.verified ? 'Yes' : 'No', true)
			.addField('Verification level', cfl(guild.verificationLevel.toLowerCase().replace(/_/g, ' ')), true);

		return channel.send(embed);
	}
};
