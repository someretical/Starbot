'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchUsers } = require('../../util/Util.js');

module.exports = class BlockUser extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'blockuser',
			description: 'prevent someone from using the bot',
			group: 'server',
			usage: '<user> <reason> <global>',
			args: [{
				name: '<user>',
				optional: false,
				description: 'an unblocked user mention or a valid ID',
				example: `<@${client.owners[0]}>`,
				code: false,
			}, {
				name: '<reason>',
				optional: true,
				description: 'max 256 character string',
				example: 'spamming',
				code: true,
			}],
			aliases: ['blacklist', 'denylist'],
			userPermissions: ['MANAGE_GUILD'],
			clientPermissions: [],
			guildOnly: true,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { client, args, author, channel, guild } = message;
		const user_id = matchUsers(args[0])[0];
		const reason = args[1] || 'None';
		let user;

		try {
			user = await client.users.fetch(user_id);

			await user.add();
			// eslint-disable-next-line no-empty
		} catch (err) {}

		// Some users may be blocked but have left the guild
		if (guild.ignores.has(user_id + guild.id)) {
			channel.embed(`<@${user_id}> is already blocked!`);
			return;
		}

		if (!user) {
			channel.embed('Please provide a valid user resolvable!');
			return;
		}

		if (reason.length > 256) {
			channel.embed('Please make sure your reason is below 256 characters long.');
			return;
		}

		const [record] = await guild.queue(() => client.db.models.Ignore.upsert({
			user_id: user_id,
			guild_id: guild.id,
			executor_id: author.id,
			reason: reason,
		}));

		client.db.cache.Ignore.set(user_id + guild.id, record);

		await channel.embed(`${user.toString()} has been blocked. Reason: ${reason}`);
	}
};
