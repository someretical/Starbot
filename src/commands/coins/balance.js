'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { pluralize, matchUsers } = require('../../util/Util.js');

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
		const invalid = () => channel.send('Please provide a valid user resolvable!');
		let user = null;

		if (!args[0]) return invalid();

		try {
			user = await client.users.fetch(!args[0] ? author.id : matchUsers(args[0])[0]);
		} catch (err) {
			return invalid();
		}

		await user.add();

		const coins = user.data.coins;
		const username = user.id === author.id ? 'You have' : `${user.toString()} has`;

		return channel.embed(`${username} ${coins} coin${pluralize(coins)}.`);
	}
}

module.exports = Balance;
