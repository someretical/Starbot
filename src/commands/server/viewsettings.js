'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { pluralize } = require('../../util/Util.js');

module.exports = class ViewSettings extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'viewsettings',
			description: 'view server settings for the bot',
			group: 'server',
			usage: '',
			args: [],
			aliases: [],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	run(message) {
		const { client, channel, guild } = message;

		const _guild = guild.model;
		const roles = _guild.ignoredRoles.length;
		const users = _guild.ignoredUsers.length;
		const channels = _guild.ignoredChannels.length;

		const embed = client.embed(null, true)
			.setTitle(`Settings for ${guild.name}`)
			.setThumbnail(guild.iconURL())
			.addField('Prefix', `\`${_guild.prefix}\``, true)
			.addField('Starboard', _guild.starboard_id ? `<#${_guild.starboard_id}>` : 'None', true)
			.addField('Starboard enabled?', _guild.starboardEnabled ? 'Yes' : 'No', true)
			.addField('Reaction threshold', `${_guild.reactionThreshold} ⭐`, true)
			.addField('Tags enabled?', _guild.tagsEnabled ? 'Yes' : 'No', true)
			.addField('Ignored roles', `${roles} role${pluralize(roles)}`, true)
			.addField('Ignored users', `${users} user${pluralize(users)}`, true)
			.addField('Ignored channels', `${channels} channel${pluralize(channels)}`, true)
			.addField('\u200b', '\u200b', true);

		channel.send(embed);
	}
};
