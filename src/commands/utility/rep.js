'use strict';

const moment = require('moment');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchUsers } = require('../../util/Util.js');

class Rep extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'rep',
			description: 'give someone one reputation',
			group: 'utility',
			usage: '<user>',
			args: [{
				name: '<user>',
				optional: false,
				description: 'a user mention or ID',
				example: `<@!${client.owners[0]}>`,
				code: false,
			}],
			aliases: ['addrep'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { client, channel, author, command, args } = message;
		const { models, cache } = message.client.db;

		const throttleDuration = command.checkThrottle(message, 'rep');
		if (throttleDuration && !client.isOwner(author.id)) {
			const timeLeft = moment(throttleDuration).fromNow(true);

			return channel.embed(`You can give another reputation point in ${timeLeft}. Please be patient.`);
		}

		const id = matchUsers(args[0])[0];
		let actualUser = null;
		try {
			actualUser = await client.users.fetch(id);
		// eslint-disable-next-line no-empty
		} catch (err) {}

		if (actualUser) await actualUser.add();

		const user = cache.User.get(id);

		if (!user) {
			return channel.embed('Please provide a valid user resolvable!');
		}

		await user.add();

		const upsertObj = user.data.toJSON();
		upsertObj.reputation++;

		const [updatedUser] = await user.queue(() => models.User.upsert(upsertObj));
		cache.User.set(user.id, updatedUser);

		await channel.embed(`You have given ${actualUser ? actualUser.toString() : `<@${user.iuser_id}>`} one reputation.`);
		return command.globalThrottle(message, 'rep', 86400000);
	}
}

module.exports = Rep;
