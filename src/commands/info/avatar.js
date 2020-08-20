'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchUsers } = require('../../util/Util.js');

class Avatar extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'avatar',
			description: 'get a user\'s profile picture',
			group: 'info',
			usage: '<user>',
			args: [{
				name: '<user>',
				optional: true,
				description: 'a user mention or ID',
				example: `<@${client.owners[0]}>`,
				code: false,
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
		const { client, author, channel, args } = message;
		const invalid = () => channel.embed('Please provide a valid user resolvable!');
		const id = !args[0] ? author.id : matchUsers(args[0])[0];

		if (!id) return invalid();

		let user = null;
		try {
			user = await client.users.fetch(id);
		} catch (err) {
			return invalid();
		}
		if (!user) return invalid();

		const url = user.avatarURL({ size: 1024 });
		const embed = client.embed()
			.setAuthor(user.tag, url, url)
			.setImage(url);

		return channel.send(embed);
	}
}

module.exports = Avatar;
