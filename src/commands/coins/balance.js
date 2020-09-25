'use strict';

const StarbotCommand = require('../../structures/StarbotCommand.js');
const { pluralize, matchUsers } = require('../../util/Util.js');

module.exports = class Balance extends StarbotCommand {
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
				defaultValue: 'message author',
				example: `<@${client.owners[0]}>`,
				code: false,
			}],
			aliases: ['coins', 'coincount', 'bal'],
			userPermissions: [],
			clientPermissions: [],
			guildOnly: false,
			ownerOnly: false,
			throttle: 5000,
		});
	}

	run(message) {
		const { client, args, author, channel } = message;
		let user;

		if (!args[0]) {
			user = author.model;
		} else {
			user = client.db.models.User.cache.get(matchUsers(args[0])[0]);

			if (!user) return channel.send('This user has not been added yet.');
		}

		const coins = user.coins;
		const username = args[0] ? `<@${user.id}> has` : 'You have';
		return channel.embed(`${username} ${coins} coin${pluralize(coins)}.`);
	}
};
