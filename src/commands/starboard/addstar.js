'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchMessageURL } = require('../../util/Util.js');

module.exports = class AddStar extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'addstar',
			description: 'add a star to a message',
			group: 'starboard',
			usage: '<message>',
			args: [{
				name: '<message>',
				optional: false,
				description: 'link to a message',
				example: 'https://discord.com/channels/361736003859513344/732842050516680705/732842074612826112',
				code: true,
			}],
			aliases: ['star'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { args, author, channel, guild } = message;
		const invalidURL = () => channel.send('Please provide a valid message URL!');

		if (!args[0]) {
			return channel.send('Please provide a message URL!');
		}

		const obj = matchMessageURL(args[0], true);
		if (!obj) return invalidURL();

		const starChannel = guild.channels.cache.get(obj.channel_id);
		if (!starChannel || starChannel.type !== 'text') return invalidURL();

		const starMessage = await starChannel.messages.fetch(obj.message_id);
		if (!starMessage) return invalidURL();

		if (starMessage.author.id === author.id) {
			return channel.send('You cannot star your own message!');
		}

		const star = await guild.starboard.getStars(starMessage.id);
		if (star) {
			if (star.reactions.cmd.includes(author.id) || star.reactions.msg.includes(author.id)) {
				return channel.send('You have already starred this message!');
			}
		}

		await guild.starboard.addStar(starMessage, author.id, true);

		return channel.embed(`You have added a star to ${starMessage.author.toString()}'s message.`);
	}
};
