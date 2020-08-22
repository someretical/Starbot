'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');

module.exports = class ReactionThreshold extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'reactionthreshold',
			description: 'set the number of stars required to save a message',
			group: 'starboard',
			usage: '<integer>',
			args: [{
				name: '<integer>',
				optional: false,
				description: 'a positive number',
				example: '2',
				code: true,
			}],
			aliases: ['reactionlimit'],
			userPermissions: ['MANAGE_GUILD'],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { client, args, channel, guild } = message;

		if (!args[0]) {
			return channel.embed('Please provide an integer!');
		}

		const limit = parseInt(args[0]);

		if (Number.isNaN(limit) || !Number.isSafeInteger(limit) || limit < 1) {
			return channel.embed('Please provide a valid integer!');
		}

		const [updatedGuild] = await guild.queue(() => client.db.models.Guild.upsert({
			id: guild.id,
			reactionThreshold: limit,
		}));

		client.db.cache.Guild.set(guild.id, updatedGuild);

		return channel.embed(`The reaction threshold for this server has been set to ${limit} ⭐.`);
	}
};
