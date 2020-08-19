'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchChannels } = require('../../util/Util.js');

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
				description: 'an unblocked text channel mention or a valid ID',
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
		const channel_ = guild.channels.cache.get(matchChannels(args[0])[0]);

		if (!channel_ || !['text', 'news'].includes(channel_.type)) {
			return channel.embed('Please provide a valid channel resolvable!');
		}

		const upsertObj = guild.settings.toJSON();
		upsertObj.ignoredChannels = JSON.parse(upsertObj.ignoredChannels);

		if (upsertObj.ignoredChannels.includes(channel_.id)) {
			return channel.embed('This channel is already ignored by the bot!');
		}

		upsertObj.ignoredChannels.push(channel_.id);
		upsertObj.ignoredChannels = JSON.stringify(upsertObj.ignoredChannels);

		const [updatedGuild] = await guild.queue(() => models.Guild.upsert(upsertObj));

		cache.Guild.set(guild.id, updatedGuild);

		return channel.embed(`${channel_.toString()} will now be ignored by the bot.`);
	}
}

module.exports = BlockChannel;
