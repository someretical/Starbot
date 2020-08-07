'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');

class FixStar extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'fixstar',
			description: 'fix the starboard embed for a starred message',
			group: 'starboard',
			usage: '<message>',
			args: [{
				name: '<message>',
				optional: false,
				description: 'link to a message',
				example: 'https://discord.com/channels/361736003859513344/732842050516680705/732842074612826112',
			}],
			aliases: ['updatestar'],
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

		const invalidURL = () => channel.embed('Please provide a valid message URL!');

		if (!args[0]) return invalidURL();

		try {
			url = new URL(args[0]);
		} catch (err) {
			return invalidURL();
		}

		if (!url.pathname) return invalidURL();

		const [, channel_id, message_id] = url.pathname.match(/\/channels\/\d+\/(\d+)\/(\d+)/) || [];
		if (!channel_id || !message_id) return invalidURL();

		const starChannel = guild.channels.cache.get(channel_id);
		if (!starChannel || starChannel.type !== 'text') return invalidURL();

		const starMessage = await starChannel.messages.fetch(message_id);
		if (!starMessage) return invalidURL();

		await guild.starboard.fixStar(starMessage);

		return channel.embed(`${starMessage.author.toString()}'s message has been fixed.`);
	}
}

module.exports = FixStar;
