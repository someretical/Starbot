'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');

class UnStar extends StarbotCommand {
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
			aliases: ['removestar', 'deletestar'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { author, channel, guild, args } = message;
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

		if (starMessage.author.id === author.id) {
			return channel.embed('You cannot unstar your own message!');
		}

		let star = await guild.starboard.getStarModel(starMessage.id);

		if (!star) {
			const status = await guild.starboard.fixStar(starMessage);
			if (status === 1) {
				return channel.embed('This message has not been starred yet!');
			}

			star = await guild.starboard.getStarModel(starMessage.id);
		}

		const cmdReactors = JSON.parse(star.cmdReactors);
		const reactors = JSON.parse(star.reactors);

		if (!cmdReactors.includes(author.id) && !reactors.includes(author.id)) {
			return channel.embed('You have not starred this message yet!');
		}

		if (!cmdReactors.includes(author.id)) {
			return channel.embed('Please unstar this message by removing your reaction from it.');
		}

		await guild.starboard.removeStar(starMessage, author.id, true);

		return channel.embed(`You have removed your star from ${starMessage.author.toString()}'s message.`);
	}
}

module.exports = UnStar;
