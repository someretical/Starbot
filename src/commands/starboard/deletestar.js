'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchMessageURL } = require('../../util/Util.js');

module.exports = class DeleteStar extends StarbotCommand {
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
				code: true,
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
		const { args, channel, guild } = message;
		const invalidURL = () => channel.embed('Please provide a valid message ID or URL!');
		let url, starMessage_id;

		if (!args[0]) return invalidURL();

		url = matchMessageURL(url);
		if (!url) return invalidURL();

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
};
