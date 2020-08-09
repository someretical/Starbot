'use strict';

const moment = require('moment');
const StarbotCommand = require('../../structures/StarbotCommand.js');

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
		const user = client.users.cache.get(args[0] ? (args[0].match(/^(?:<@!?)?(\d+)>?$/) || [])[1] : null);

		const throttleDuration = command.checkThrottle(message, 'rep');

		if (throttleDuration && !client.isOwner(author.id)) {
			const timeLeft = moment(throttleDuration).fromNow(true);

			return channel.embed(`You can give another reputation point in ${timeLeft}. Please be patient.`);
		}

		if (!user) {
			return channel.embed('Please provide a valid user resolvable!');
		}

		await user.add();

		const upsertObj = user.data.toJSON();
		upsertObj.reputation++;

		const [updatedUser] = await user.queue(() => models.User.upsert(upsertObj));
		cache.User.set(user.id, updatedUser);

		await channel.embed(`You have given ${user.toString()} one reputation.`);
		return command.globalThrottle(message, 'rep', 86400000);
	}
}

module.exports = Rep;
