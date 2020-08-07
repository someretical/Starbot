'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');

class DeleteStar extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'deletestar',
			description: 'delete a starred message and its corresponding starboard message',
			group: 'starboard',
			usage: '<message>',
			args: [{
				name: '<message>',
				optional: false,
				description: 'link to a message or a message ID',
				example: 'https://discord.com/channels/361736003859513344/732842050516680705/732842074612826112',
			}],
			aliases: ['purgestar'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 10000,
		});
	}

	async run(message) {
		const { channel, guild, args } = message;
		let url = null;
		let starMessage_id = null;

		const invalidURL = () => channel.embed('Please provide a valid message ID or URL!');

		if (!args[0]) return invalidURL();

		try {
			url = new URL(args[0]);
		} catch (err) {
			url = (args[0].match(/^\d+$/) || [])[1];
		}

		if (!url) return invalidURL();

		if (url.prototype instanceof URL) {
			if (!url.pathname) return invalidURL();

			const [, , message_id] = url.pathname.match(/\/channels\/\d+\/(\d+)\/(\d+)/) || [];
			if (!message_id) return invalidURL();

			starMessage_id = message_id;
		} else {
			starMessage_id = args[0];
		}

		const star = guild.starboard.getStarModel(starMessage_id);
		if (!star) {
			return channel.embed('This message has not been starred!');
		}

		await guild.starboard.destroyStar(star);

		const starChannel = guild.channels.cache.get(star.channel_id);
		if (starChannel) {
			const starMessage = await starChannel.messages.fetch(star.message_id);
			if (starMessage && starChannel.permissionsFor(guild.me).has('MANAGE_MESSAGES')) {
				await starMessage.delete();
			}
		}

		return channel.embed(`The specified message has been deleted.`);
	}
}

module.exports = DeleteStar;
