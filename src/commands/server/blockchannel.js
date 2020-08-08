'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');

class BlockChannel extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'blockchannel',
			description: 'make the bot ignore a channel',
			group: 'server',
			usage: '<channel>',
			args: [{
				name: '<channel>',
				optional: false,
				description: 'a channel mention or a valid ID',
				example: client.owners[0],
			}],
			aliases: ['ignorechannel'],
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

		if (!['text', 'news'].includes(guild.channels.cache.get(id).type)) {
			return channel.embed('Please provide a text channel!');
		}

		const { settings } = guild;
		const ignoredChannels = JSON.parse(settings.ignoredChannels);

		if (ignoredChannels.includes(id)) {
			return channel.embed('This channel is already ignored by the bot!');
		}

		ignoredChannels.push(id);

		const upsertObj = settings.get();
		upsertObj.ignoredChannels = JSON.stringify(ignoredChannels);

		const [updatedGuild] = await guild.queue(() => models.Guild.upsert(upsertObj));

		cache.Guild.set(guild.id, updatedGuild);

		return channel.embed(`The channel <#${id}> will now be ignored by the bot.`);
	}
}

module.exports = BlockChannel;
