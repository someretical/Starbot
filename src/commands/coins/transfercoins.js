'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { pluralize, matchUsers } = require('../../util/Util.js');

class TransferCoins extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'transfercoins',
			description: 'transfer coins to another user',
			group: 'coins',
			usage: '<user> <amount>',
			args: [{
				name: '<user>',
				optional: false,
				description: 'a user mention or ID',
				example: `<@${client.owners[0]}>`,
				code: false,
			}, {
				name: '<amount>',
				optional: false,
				description: 'amount of coins to transfer',
				example: '420',
				code: true,
			}],
			aliases: ['movecoins', 'laundercoins'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { client, author, channel, args } = message;
		const { models, cache } = message.client.db;
		const invalid = () => channel.send('Please provide a valid user resolvable!');
		const amount = parseInt(args[0]);
		const authorData = author.data;
		let user = null;

		if (!args[0]) return invalid();

		try {
			user = await client.users.fetch(matchUsers(args[0])[0]);
		} catch (err) {
			return invalid();
		}

		if (Number.isNaN(amount) || !Number.isSafeInteger(amount) || amount < 1) {
			return channel.embed('Please provide a valid number of coins to transfer!');
		}

		if (amount > authorData.coins) {
			return channel.embed('You do not have enough coins to complete the transfer!');
		}

		await user.add();

		let user1 = null, user2 = null;

		await client.sequelize.transaction(async t => {
			const upsertObj1 = authorData.toJSON();
			upsertObj1.coins -= amount;

			const [user1_] = await author.queue(() => models.User.upsert(upsertObj1, {
				transaction: t,
			}));
			user1 = user1_;

			const upsertObj2 = user.data.toJSON();
			upsertObj2.coins += amount;

			const [user2_] = await user.queue(() => models.User.upsert(upsertObj2, {
				transaction: t,
			}));
			user2 = user2_;
		});

		cache.User.set(user1.id, user1);
		cache.User.set(user2.id, user2);

		return channel.embed(`You have transferred ${amount} coin${pluralize(amount)} to ${user.toString()}.`);
	}
}

module.exports = TransferCoins;
