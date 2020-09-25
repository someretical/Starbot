'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchMessageURL } = require('../../util/Util.js');

module.exports = class FixStar extends StarbotCommand {
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
			throttle: 20000,
		});
	}

	async run(message) {
		const { args, channel, guild } = message;
		const invalidURL = () => channel.send('Please provide a valid message URL!');

		if (!args[0]) {
			return channel.send('Please provide a message URL!');
		}

		const obj = matchMessageURL(args[0], true);
		if (!obj) return invalidURL();

		const starChannel = guild.channels.cache.get(obj.channel_id);
		if (!starChannel || starChannel.type !== 'text') return invalidURL();

		let starMessage;
		try {
			starMessage = await starChannel.messages.fetch(obj.message_id);
		} catch (err) {
			return invalidURL();
		}
		if (!starMessage) return undefined;

		await guild.starboard.fixStar(starMessage);

		return channel.embed(`${starMessage.author.toString()}'s message has been fixed.`);
	}
};
