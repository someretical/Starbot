'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');

module.exports = class Star extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'star',
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
			aliases: ['addstar'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { args, author, channel, guild } = message;
		const invalidURL = () => channel.embed('Please provide a valid message URL!');

		if (!args[0]) return invalidURL();

		let url;
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
			return channel.embed('You cannot star your own message!');
		}

		const star = await guild.starboard.getStarModel(starMessage.id);
		if (star) {
			const cmdReactors = JSON.parse(star.cmdReactors);
			const reactors = JSON.parse(star.reactors);

			if (cmdReactors.includes(author.id) || reactors.includes(author.id)) {
				return channel.embed('You have already starred this message!');
			}
		}

		await guild.starboard.addStar(starMessage, author.id, true);

		return channel.embed(`You have added a star to ${starMessage.author.toString()}'s message.`);
	}
};
