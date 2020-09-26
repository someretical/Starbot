'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchUsers } = require('../../util/Util.js');
const IMAGE_SIZES = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
const IMAGE_FORMATS = ['webp', 'png', 'jpg', 'jpeg', 'gif'];

module.exports = class Avatar extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'avatar',
			description: 'get a user\'s profile picture',
			group: 'info',
			usage: '<user> <size> <format>',
			args: [{
				name: '<user>',
				optional: true,
				description: 'a user mention or ID',
				defaultValue: 'message author',
				example: `<@${client.owners[0]}>`,
				code: false,
			}, {
				name: '<size>',
				optional: true,
				description: 'the size of the provided avatar (one of 16, 32, 64, 128, 256, 512, 1024, 2048, 4096)',
				defaultValue: '1024',
				example: `1024`,
			}, {
				name: '<format>',
				optional: true,
				description: 'the format of the provided avatar (one of webp, png, jpg, jpeg, gif)',
				defaultValue: 'webp',
				example: `png`,
			}],
			aliases: ['profilepicture', 'pfp'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { client, args, author, channel } = message;

		let user, userArg;
		if (!args[0]) {
			user = author;
			userArg = false;
		}

		try {
			user = await client.users.fetch(matchUsers(args[0])[0]);
		} catch (err) {
			return channel.send('Please provide a valid user resolvable!');
		}

		const size = parseInt(userArg ? args[1] : args[0]);
		if (args[0] && !IMAGE_SIZES.includes(size)) {
			return channel.send('Please provide a valid avatar size!');
		}

		const format = userArg ? args[2] : args[1];
		if (args[1] && !IMAGE_FORMATS.includes(format)) {
			return channel.send('Please provide a valid avatar format');
		}

		const url = user.avatarURL({ size: size || 1024, format: format || 'webp' });
		const embed = client.embed()
			.setAuthor(user.tag, user.avatarURL(), user.avatarURL())
			.setImage(url);

		return channel.send(embed);
	}
};
