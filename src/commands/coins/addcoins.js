'use strict';

const moment = require('moment');
const StarbotCommand = require('../../structures/StarbotCommand.js');

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
		const throttleDuration = command.checkThrottle(message, 'addcoins');

		if (throttleDuration && !client.isOwner(author.id)) {
			const timeLeft = moment(throttleDuration).fromNow(true);

			return channel.embed(`You can claim your next bag of coins in ${timeLeft}. Please be patient.`);
		}

		const upsertObj = author.data.toJSON();
		upsertObj.coins += 100;
		upsertObj.username = author.username;
		upsertObj.discriminator = author.discriminator;

		const [updatedUser] = await author.queue(() => client.db.models.User.upsert(upsertObj));

		client.db.cache.User.set(author.id, updatedUser);

		await channel.embed(`You have claimed your daily 100 coins! You now have ${updatedUser.coins} coins.`);

		return command.globalThrottle(message, 'addcoins', 86400000);
	}
};
