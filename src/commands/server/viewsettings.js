'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');

class ViewSettings extends StarbotCommand {
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
		const { client, channel } = message;
		const { settings } = message.guild;

		const ignoredChannels = JSON.parse(settings.ignoredChannels);
		let displayedChannels = (ignoredChannels.length < 11 ?
			ignoredChannels :
			ignoredChannels.slice(0, -ignoredChannels.length + 10))
			.map(id => `<#${id}>`)
			.join(', ');

		if (ignoredChannels.length > 10) displayedChannels += '...';

		const embed = client.embed(null, true)
			.setTitle(`Settings for ${message.guild.name}`)
			.setThumbnail(message.guild.iconURL())
			.addField('Prefix', `\`${settings.prefix}\``, true)
			.addField('Starboard', settings.starboard_id ? `<#${settings.starboard_id}>` : 'None', true)
			.addField('Starboard enabled?', settings.starboardEnabled ? 'Yes' : 'No', true)
			.addField('Reaction threshold', `${settings.reactionThreshold} ⭐`, true)
			.addField('Tags enabled?', settings.tagsEnabled ? 'Yes' : 'No', true)
			.addField('Ignored channels', displayedChannels, true);

		channel.send(embed);
	}
}

module.exports = ViewSettings;
