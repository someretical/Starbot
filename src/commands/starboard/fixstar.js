'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchMessageURL } = require('../../util/Util.js');
const { invalid } = require('moment');

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
				code: true,
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

		url = matchMessageURL(url);
		if (!url) return invalid();

		const starChannel = guild.channels.cache.get(url.channel_id);
		if (!starChannel || starChannel.type !== 'text') return invalidURL();

		const starMessage = await starChannel.messages.fetch(url.message_id);
		if (!starMessage) return invalidURL();

		await guild.starboard.fixStar(starMessage);

		return channel.embed(`${starMessage.author.toString()}'s message has been fixed.`);
	}
}

module.exports = FixStar;
