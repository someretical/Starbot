'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');

class SetStarboard extends StarbotCommand {
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
				example: client.owners[0],
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
		const { args, channel, guild } = message;
		const { cache, models } = message.client.db;

		if (!args[0]) {
			return channel.embed('Please provide a channel resolvable!');
		}

		const id = (args[0].match(/^(?:<#(\d+)>|(\d+))$/) || [])[1];

		if (!guild.channels.cache.has(id)) {
			return channel.embed('Sorry but the bot couldn\'t find that channel.');
		}

		const starboard = guild.channels.cache.get(id);

		if (starboard.type !== 'text') {
			return channel.embed('Please provide a **text** channel!');
		}

		const [updatedGuild] = await guild.queue(() => models.Guild.upsert({
			id: guild.id,
			starboard_id: id,
		}));

		cache.Guild.set(guild.id, updatedGuild);

		return channel.embed(`The channel <#${id}> has been set as the starboard.`);
	}
}

module.exports = SetStarboard;
