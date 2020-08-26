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

		const s = guild.settings;
		const ignoredChannels = JSON.parse(guild.settings.ignoredChannels);
		const embed = client.embed(null, true)
			.setTitle(`Settings for ${guild.name}`)
			.setThumbnail(guild.iconURL())
			.addField('Prefix', `\`${s.prefix}\``, true)
			.addField('Starboard', s.starboard_id ? `<#${s.starboard_id}>` : 'None', true)
			.addField('Starboard enabled?', s.starboardEnabled ? 'Yes' : 'No', true)
			.addField('Reaction threshold', `${s.reactionThreshold} ⭐`, true)
			.addField('Tags enabled?', s.tagsEnabled ? 'Yes' : 'No', true)
			.addField('Ignored channels', `${ignoredChannels.length} channel${pluralize(ignoredChannels.length)}`, true);

		channel.send(embed);
	}
};
