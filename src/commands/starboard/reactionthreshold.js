'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');

class ReactionThreshold extends StarbotCommand {
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
		const { args, channel, guild } = message;
		const { cache, models } = message.client.db;

		if (!args[0]) {
			return channel.embed('Please provide an integer!');
		}

		const limit = Number(args[0]);

		if (Number.isNaN(limit) || !Number.isInteger(limit) || limit < 1) {
			return channel.embed('Please provide a valid integer!');
		}

		const [updatedGuild] = await guild.queue(() => models.Guild.upsert({
			id: guild.id,
			reactionThreshold: limit,
		}));

		cache.Guild.set(guild.id, updatedGuild);

		return channel.embed(`The reaction threshold for this server has been set to ${limit} ⭐.`);
	}
}

module.exports = ReactionThreshold;
