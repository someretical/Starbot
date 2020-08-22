'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchChannels } = require('../../util/Util.js');

module.exports = class SetStarboard extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'setstarboard',
			description: 'set the channel the bot should use as a starboard',
			group: 'starboard',
			usage: '<channel>',
			args: [{
				name: '<channel>',
				optional: false,
				description: 'a channel mention or a valid ID',
				example: `<#${client.snowflake()}>`,
			}],
			aliases: ['setsb'],
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
			return channel.embed('Please provide a channel resolvable!');
		}

		const starboard = guild.channels.cache.get(matchChannels(args[0])[0]);
		if (!starboard) {
			return channel.embed('Sorry but the bot couldn\'t find that channel.');
		}

		if (starboard.type !== 'text') {
			return channel.embed('Please provide a **text** channel!');
		}

		const [updatedGuild] = await guild.queue(() => client.db.models.Guild.upsert({
			id: guild.id,
			starboard_id: starboard.id,
		}));

		client.db.cache.Guild.set(guild.id, updatedGuild);

		return channel.embed(`The channel ${starboard.toString()} has been set as the starboard.`);
	}
};
