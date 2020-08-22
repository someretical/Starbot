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
		const { client, args, author, channel, guild } = message;
		const owner = client.isOwner(author.id);
		const user_id = matchUsers(args[0])[0];
		const ignored = guild.ignores.get(user_id + guild.id);
		let reason, global_ = false;

		if (!ignored) {
			channel.embed(`<@${user_id}> is not blocked!`);
			return;
		}

		if (/^-(?:g|-global)$/i.test(args[1]) && owner) {
			reason = 'None';
			global_ = true;
		} else {
			reason = args[1] || 'None';
		}

		if (reason.length > 256) {
			channel.embed('Please make sure your reason is below 256 characters long.');
			return;
		}

		if (global_) {
			await ignored.destroy();

			client.db.cache.GlobalIgnore.delete(user_id);

			await channel.embed(`<@${user_id}> has been globally unblocked. Reason: ${reason}`);
		} else {
			await guild.queue(ignored.destroy);

			client.db.cache.Ignore.delete(user_id + guild.id);

			await channel.embed(`<@${user_id}> has been unblocked. Reason: ${reason}`);
		}
	}
};
