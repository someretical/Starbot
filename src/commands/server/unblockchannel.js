'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');

class UnblockChannel extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'unblockchannel',
			description: 'make the bot listen to a channel again',
			group: 'server',
			usage: '<channel>',
			args: [{
				name: '<channel>',
				optional: false,
				description: 'a channel mention or a valid ID',
				example: client.owners[0],
			}],
			aliases: ['unignorechannel'],
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
		const unblockedChannel = guild.channels.cache.get(id);

		if (!unblockedChannel) {
			return channel.embed('Sorry but the bot couldn\'t find that channel.');
		}

		const { settings } = guild;
		const ignoredChannels = JSON.parse(settings.ignoredChannels);

		if (ignoredChannels.includes(id)) {
			ignoredChannels.splice(ignoredChannels.indexOf(id), 1);

			const upsertObj = settings.get();
			upsertObj.ignoredChannels = JSON.stringify(ignoredChannels);

			const [updatedGuild] = await guild.queue(() => models.Guild.upsert(upsertObj));

			cache.Guild.set(guild.id, updatedGuild);
		}

		return channel.embed(`The bot will now be listening to ${unblockedChannel.toString()}.`);
	}
}

module.exports = UnblockChannel;
