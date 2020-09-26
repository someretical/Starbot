'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const IMAGE_SIZES = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
const IMAGE_FORMATS = ['webp', 'png', 'jpg', 'jpeg', 'gif'];

module.exports = class ServerIcon extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'servericon',
			description: 'get the server\'s icon',
			group: 'info',
			usage: '<size> <format>',
			args: [{
				name: '<size>',
				optional: true,
				description: 'the size of the provided icon (one of 16, 32, 64, 128, 256, 512, 1024, 2048, 4096)',
				defaultValue: '1024',
				example: `1024`,
			}, {
				name: '<format>',
				optional: true,
				description: 'the format of the provided icon (one of webp, png, jpg, jpeg, gif)',
				defaultValue: 'webp',
				example: `png`,
			}],
			aliases: ['servericon'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	run(message) {
		const { client, args, channel, guild } = message;

		let url = guild.iconURL({ size: 1024 });
		if (!url) {
			return channel.send('This guild does not have a custom icon.');
		}

		if (args[0] && !IMAGE_SIZES.includes(parseInt(args[0]))) {
			return channel.send('Please provide a valid icon size!');
		}

		if (args[1] && !IMAGE_FORMATS.includes(args[1])) {
			return channel.send('Please provide a valid icon format');
		}

		url = guild.iconURL({ size: parseInt(args[0]) || 1024, format: args[1] || 'webp' });
		const embed = client.embed()
			.setAuthor(guild.name, guild.iconURL(), `https://discord.com/channels/${guild.id}`)
			.setImage(url);

		return channel.send(embed);
	}
};
