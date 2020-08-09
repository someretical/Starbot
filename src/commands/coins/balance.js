'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { pluralize } = require('../../util/Util.js');

class Balance extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'balance',
			description: 'get someone\'s coin balance',
			group: 'coins',
			usage: '<user>',
			args: [{
				name: '<user>',
				optional: true,
				description: 'a user mention or ID',
				example: `<@!${client.owners[0]}>`,
			}],
			aliases: ['coins', 'coincount', 'bal'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	async run(message) {
		const { client, author, channel, args } = message;
		let user = !args[0] ? author : (args[0].match(/^(?:<@!?)?(\d+)>?$/) || [])[1];

		if (!user) {
			return channel.embed('Please provide a valid user resolvable!');
		}

		user = user.id ? user : client.users.cache.get(user);
		await user.add();

		const coins = user.data.coins;
		const username = user.id === author.id ? 'You have' : `${user.toString()} has`;

		return channel.embed(`${username} ${coins} coin${pluralize(coins)}.`);
	}
}

module.exports = Balance;
