'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');

class ServerIcon extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'servericon',
			description: 'get the server\'s icon',
			group: 'info',
			usage: '',
			args: [],
			aliases: ['servericon'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	run(message) {
		const { client, channel, guild } = message;

		const url = guild.iconURL({ size: 1024 });
		if (!url) {
			return channel.embed('This guild does not have a custom icon.');
		}

		const embed = client.embed()
			.setAuthor(guild.name, url, url)
			.setImage(url);

		return channel.send(embed);
	}
}

module.exports = ServerIcon;
