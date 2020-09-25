'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { pluralize } = require('../../util/Util.js');

module.exports = class AddCoins extends StarbotCommand {
	constructor(client) {
		super(client, {
			name: 'addcoins',
			description: 'claim your daily coins',
			group: 'coins',
			usage: '',
			args: [],
			aliases: ['claimcoins'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: false,
			throttle: 0,
		});
	}

	async run(message) {
		const { client, author, channel, command } = message;

		if (await command.checkThrottle(message, 'addcoins')) return undefined;

		const user = author.data();
		const coins = user.coins + 100;
		await client.db.models.User.q.add(user.id, () => user.update({ coins: coins }));

		await channel.send(`You have claimed 100 coins! You now have ${coins} coin${pluralize(coins)}.`);

		return command.customThrottle(message, 'addcoins', 86400000);
	}
};
