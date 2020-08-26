'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchUsers } = require('../../util/Util.js');

module.exports = class UnblockUser extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'unblockuser',
			description: 'allow someone to use the bot again',
			group: 'server',
			usage: '<user>',
			args: [{
				name: '<user>',
				optional: false,
				description: 'a blocked user mention or a valid ID',
				example: `<@${client.owners[0]}>`,
				code: false,
			}],
			aliases: ['whitelist', 'allowlist'],
			userPermissions: ['MANAGE_GUILD'],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { client, args, channel, guild } = message;
		const ignored = guild.ignores.get(matchUsers(args[0])[0] + guild.id);

		if (!ignored) {
			channel.embed(`<@${ignored.user_id}> is not blocked!`);
			return;
		}

		await guild.queue(ignored.destroy);

		client.db.cache.Ignore.delete(ignored.user_id + guild.id);

		await channel.embed(`<@${ignored.user_id}> has been unblocked.`);
	}
};
