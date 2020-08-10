'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchChannel } = require('../../util/Util.js');

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
				description: 'a blocked text channel mention or a valid ID',
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
		const invalid = () => channel.embed('Please provide a channel which has been blocked!');

		if (!args[0]) return invalid();

		const id = matchChannel(args[0])[0];
		if (!id) return invalid();

		const upsertObj = guild.settings.toJSON();
		upsertObj.ignoredChannels = JSON.parse(upsertObj.ignoredChannels);

		if (!upsertObj.ignoredChannels.includes(id)) return invalid();

		upsertObj.ignoredChannels.splice(upsertObj.ignoredChannels.indexOf(id), 1);
		upsertObj.ignoredChannels = JSON.stringify(upsertObj.ignoredChannels);

		const [updatedGuild] = await guild.queue(() => models.Guild.upsert(upsertObj));

		cache.Guild.set(guild.id, updatedGuild);

		return channel.embed(`The bot will now be listening to <#${id}>.`);
	}
}

module.exports = UnblockChannel;
