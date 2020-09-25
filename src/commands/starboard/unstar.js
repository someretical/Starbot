'use strict';

const { oneLine } = require('common-tags');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchMessageURL } = require('../../util/Util.js');

module.exports = class UnStar extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'unstar',
			description: 'remove your star from a message',
			group: 'starboard',
			usage: '<message>',
			args: [{
				name: '<message>',
				optional: false,
				description: 'link to a message',
				example: 'https://discord.com/channels/361736003859513344/732842050516680705/732842074612826112',
			}],
			aliases: [],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { client, args, author, channel, guild } = message;
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

		if (starMessage.author.id === author.id) {
			return channel.send('You cannot unstar your own message!');
		}

		const star = await guild.starboard.getStars(starMessage.id);
		if (star) {
			if (!star.reactions.cmd.includes(author.id) && !star.reactions.msg.includes(author.id)) {
				return channel.send('You have not starred this message!');
			}

			if (star.reactions.msg.includes(author.id)) {
				return channel.send('Please unstar this message by removing your reaction from it.');
			}

			await guild.starboard.removeStar(starMessage, author.id, true);

			return channel.embed(`You have unstarred ${starMessage.author.toString()}'s message.`);
		} else {
			return channel.send(oneLine`This message has not been starred yet. 
				If it has reactions, please run \`${client.prefix}fixstar ${starMessage.url}\` first.`);
		}
	}
};
