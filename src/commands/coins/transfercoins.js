'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { pluralize, matchUsers } = require('../../util/Util.js');

module.exports = class TransferCoins extends StarbotCommand {
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
			}],
			aliases: ['transfer', 'movecoins', 'givecoins'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { client, args, author, channel } = message;

		if (!args[0]) {
			channel.send('Please provide a valid user resolvable!');
		}

		const amount = parseInt(args[1]);

		if (Number.isNaN(amount) || !Number.isSafeInteger(amount) || amount < 1) {
			return channel.send('Please provide a valid number of coins to transfer!');
		}

		const sender = author.model;
		const receiver = client.db.models.User.cache.get(matchUsers(args[0])[0]);
		if (!receiver) {
			return channel.send('This user has not been added yet.');
		}

		if (sender.id === receiver.id) {
			return channel.send('You cannot transfer money to yourself!');
		}

		if (amount > sender.coins) {
			return channel.embed('You do not have enough coins to complete the transfer!');
		}

		await client.db.transaction(async t => {
			await client.db.models.User.q.add(sender.id, () => sender.update({ coins: sender.coins - amount },
				{ transaction: t },
			));

			client.db.models.User.q.add(receiver.id, () => receiver.update({ coins: receiver.coins + amount },
				{ transaction: t },
			));
		});

		return channel.embed(`You have transferred ${amount} coin${pluralize(amount)} to <@${receiver.id}>.`);
	}
};
