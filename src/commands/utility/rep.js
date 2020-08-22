'use strict';

const moment = require('moment');
const StarbotCommand = require('../../structures/StarbotCommand.js');
const { matchUsers } = require('../../util/Util.js');

module.exports = class Rep extends StarbotCommand {
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
		const { client, args, author, channel, command } = message;

		const throttleDuration = command.checkThrottle(message, 'rep');
		if (throttleDuration && !client.isOwner(author.id)) {
			const timeLeft = moment(throttleDuration).fromNow(true);

			return channel.embed(`You can give another reputation point in ${timeLeft}. Please be patient.`);
		}

		const id = matchUsers(args[0])[0];
		let user;
		try {
			user = await client.users.fetch(id);
		// eslint-disable-next-line no-empty
		} catch (err) {}

		if (user) await user.add();
		if (!user) {
			return channel.embed('Please provide a valid user resolvable!');
		}

		const upsertObj = user.data.toJSON();
		upsertObj.reputation++;
		upsertObj.username = user.username;
		upsertObj.discriminator = user.discriminator;

		const [updatedUser] = await user.queue(() => client.db.models.User.upsert(upsertObj));
		client.db.cache.User.set(user.id, updatedUser);

		await channel.embed(`You have given ${user.toString()} one reputation.`);
		return command.globalThrottle(message, 'rep', 86400000);
	}
};
